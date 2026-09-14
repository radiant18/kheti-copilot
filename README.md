# Kheti — Farmer's Copilot

A daily decision engine for farmers in India. Not a chatbot: it answers the
questions a farmer actually has each morning — *do I irrigate, do I spray, is my
crop sick, where do I sell* — puts a rupee figure on each, and lets him sell the
lot directly to a buyer instead of through a commission agent.

**132 crops**, four languages (English, Hindi, Kannada, Marathi), and an engine
that works the same for a tomato grower in Kolar as for an arecanut grower in
Puttur.

## The two halves

**Tell him what to do today.** Weather-driven irrigation and spray timing,
disease pressure counted in canopy wet-hours rather than guessed from rainfall,
and fertiliser reminders. Five fixed cards, same order every morning, because
the screen gets thirty seconds at dawn and a farmer should not have to hunt.

**Let him sell it himself.** A farmer posts a lot; a buyer searches by crop;
both sides see what the mandi is paying for that grade *today*. That live
reference price is the whole point — a grower who can see the yard clearing
₹50,891 does not accept ₹44,000 from a trader who says the market is soft.

Agmarknet routinely publishes wildly different prices for the same commodity on
the same day in the same belt. Grade and yard choice is real, unclaimed money,
and it is the same arithmetic whichever crop you grow.

### What this deliberately is not

No payments, no escrow, no delivery, no grading arbitration. Standing between
two people's money needs a licence, a dispute process and insurance, none of
which an app can improvise. Kheti introduces a farmer to a buyer and gets out of
the way. A phone number appears on a listing only because the farmer ticked the
consent box, the lot itself is unverified, and the UI says so.

The number, though, is checked. Signing in sends a six-digit code to it by SMS
— the one channel that needs no app installed, reaches a feature phone, and
that Android reads into the code box by itself — and answering that code earns a signed token naming the number; every
route that publishes or messages a number reads it off that token and ignores
whatever the request body claims. Without it, anybody could post a lot carrying
a stranger's number and put it in front of every buyer in the state — the one
thing on this board that cannot be undone once somebody has written it down.
`lib/otp.ts` has the detail. It is still not user authentication: the token says
the number was reachable, not who is holding the phone.

## Architecture

One codebase, three targets.

```
next build                 → web app on Vercel, API routes included
MOBILE_BUILD=1 next build  → static bundle in ./out
npx cap sync               → Android + iOS shells wrapping that bundle
```

The mobile shells have no server, so every network call goes through
`lib/api.ts`, which prefixes `NEXT_PUBLIC_API_BASE`. On web that is empty
(same-origin `/api/*`); in the app it points at the deployed origin. That single
indirection is what keeps the three targets on identical screens.

### The engine is rules first, LLM second

`lib/engine/` is pure, deterministic and dependency-free. It decides everything.
An LLM layer may translate a `Recommendation` or read it aloud, but it may never
originate one. A hallucinated fungicide dose is a destroyed crop, so the model is
not allowed near the decision.

| Module | Responsibility |
| --- | --- |
| `engine/agronomy.ts` | Weather-driven spray and irrigation rules, crop-agnostic — thresholds come off the `CropConfig` |
| `engine/water.ts` | How much water the sun and wind actually took out of the soil |
| `engine/pressure.ts` | Disease pressure as canopy wet-hours inside a temperature band |
| `engine/nutrition.ts` | Fertiliser timing — when the next round falls due, never what or how much |
| `engine/conditions.ts` | What it is doing outside right now and across the rest of today |
| `engine/market.ts` | Grade normalisation, mandi arbitrage net of transport, yield curve, P&L |
| `engine/today.ts` | The five cards on the Today screen, always in the same order |
| `engine/index.ts` | Composes the day's plan for whatever crop this farm grows |

Nothing in the engine knows what crop it is looking at, and nothing in it writes
an English sentence — wording lives in `lib/messages.ts`, and the engine supplies
the key and the numbers. That is what makes 132 crops and four languages one
code path instead of 528.

Because the engine is pure, it runs client-side against cached inputs — a farmer
with no signal still gets yesterday's weather run through today's rules.

### Crops and places

`lib/crops/registry.ts` holds the 132 crop configs; an unknown id degrades to a
generic crop rather than crashing, and renamed ids are migrated so a saved farm
never silently loses its disease rules.

`lib/places.ts` covers 16 states. Karnataka is at taluk level because that is the
launch region; the rest carry their main agricultural districts. District
centroids are close enough for weather, and the state is what scopes the mandi
price query.

## Data sources

| Source | Used for | Status |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com) | Forecast, humidity, derived dry hours | Working. Free tier is **non-commercial** — needs a paid plan or IMD licence before launch |
| [data.gov.in / Agmarknet](https://www.data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi) | Daily mandi prices by grade | Working with a key; falls back to bundled sample quotes |
| Local snapshots | Week-on-week price trend | Agmarknet has no history endpoint, so the app records its own |

## Setup

```bash
npm install
cp .env.example .env.local   # add DATA_GOV_API_KEY
npm run dev
```

Sign-in codes work out of the box in development: with no message provider
configured nothing is sent and the code is shown on the screen instead. In
production that is refused — a code returned to the caller verifies nobody — so
a deployment needs `OTP_SECRET` and a way to send.

Sending to an Indian number needs a **DLT registration**: a six-letter sender
header and a template whose wording TRAI has approved, with the code as a
variable. That is paperwork against a business entity and cannot be arranged in
code, so budget for it before launch. `lib/sms.ts` speaks to MSG91 or Twilio —
set one provider's keys and leave `SMS_PROVIDER` blank to have it inferred. A
deployment with a Meta account but no DLT registration yet can fall back to
WhatsApp for the code by configuring only the WhatsApp side.

Get a free key at https://data.gov.in — sign in, then My Account → API key. The
shared sample key in the public docs is rate-limited and will 429 mid-demo.

## Deploying

The web app is a normal Next.js app — Vercel needs no configuration beyond the
two environment variables. `vercel.json` only stops the service worker being
cached, which would otherwise pin users to an old build.

```bash
npx vercel            # first run links the project
npx vercel --prod
```

Set `DATA_GOV_API_KEY`, `ANTHROPIC_API_KEY` and `OTP_SECRET` in the Vercel
dashboard, not in the repo. A missing `OTP_SECRET` in production stops sign-in
rather than falling back, because an unsigned token is a forgeable one.

## Offline

`public/sw.js` caches the app shell so it opens with no signal — the case that
matters, since a farmer checks the plan at dawn in the field on one bar. The
rules then re-run on the inputs already in localStorage.

It registers in production only. A service worker in development serves stale
chunks after every edit, which reads exactly like a bug.

## Mobile

The mobile shell has no server of its own, so `npm run build:mobile` moves
`app/api` aside for the duration of the static export and restores it in a
`finally` block. The app inside the shell calls the deployed origin instead,
which is why `NEXT_PUBLIC_API_BASE` is required for this build and ignored on
web.

```bash
NEXT_PUBLIC_API_BASE=https://your-deployment.vercel.app npm run build:mobile
npx cap sync
npx cap open android          # needs Android Studio
```

`npx cap add android` has already been run; the project is committed. Building
an APK needs a JDK and the Android SDK, which Android Studio installs.

## Caveats

- Agronomic thresholds follow published ICAR practice but **have not been
  reviewed by an agronomist**. Do that before any real farmer sees a spray
  recommendation.
- Transport costs are a flat per-km tempo estimate, not real quotes.
- Listings are file-backed (`lib/listings.ts`, `lib/subscribers.ts`), which works
  locally and on a normal server but needs a real database on serverless.
- Pending sign-in codes live in process memory (`lib/otp.ts`) and need the same
  swap — Redis or Vercel KV, keyed by phone with a TTL — before serverless, or
  the invocation that checks a code will not be the one that issued it. Issued
  tokens are signed rather than stored and survive a restart.
- Lots are unverified. Anyone with a proved number can post one, and a buyer
  must still do their own diligence on grade, quantity and price.
