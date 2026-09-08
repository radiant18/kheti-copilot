# Kheti — Arecanut Copilot

A daily decision engine for arecanut growers in coastal Karnataka. Not a chatbot:
it answers the four questions a grower actually has each morning — *do I irrigate,
do I spray, is my garden sick, where do I sell* — and puts a rupee figure on each.

## Why arecanut, why here

- Karnataka grows the majority of India's arecanut; roughly 50 lakh people in the
  state depend on it.
- Two acute, simultaneous crises: Yellow Leaf Disease wiping out mature gardens,
  and prices that swung from ₹58,000 to ₹39,000 per quintal inside one season.
- Agmarknet shows Rashi grade clearing ~₹50,900/qtl while CQCA clears ~₹27,000
  on the same day in the same belt. Grade and yard choice is real, unclaimed money.
- Bharat-VISTAAR, the government's AI advisory platform launched Feb 2026, ships
  phase 1 in Hindi and English across Maharashtra, Bihar and Gujarat. Karnataka
  and Kannada are not in it.

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
An LLM layer may later translate a `Recommendation` into Kannada or read it
aloud, but it may never originate one. A hallucinated fungicide dose is a
destroyed crop, so the model is not allowed near the decision.

| Module | Responsibility |
| --- | --- |
| `engine/agronomy.ts` | Irrigation cycles, koleroga spray windows, YLD prompts |
| `engine/market.ts` | Grade normalisation, mandi arbitrage net of transport, yield curve, P&L |
| `engine/index.ts` | Composes and ranks the day's plan by urgency, then rupee impact |

Because the engine is pure, it runs client-side against cached inputs — a farmer
with no signal still gets yesterday's weather run through today's rules.

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

Set `DATA_GOV_API_KEY` and `ANTHROPIC_API_KEY` in the Vercel dashboard, not in
the repo.

## Offline

`public/sw.js` caches the app shell so it opens with no signal — the case that
matters, since a grower checks the plan at dawn under canopy on one bar. The
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

- Agronomic thresholds in `engine/agronomy.ts` follow published ICAR-CPCRI
  practice for the DK/UK belt but **have not been reviewed by an agronomist**.
  Do that before any real grower sees a spray recommendation.
- Transport costs are a flat per-km tempo estimate, not real quotes.
- The mandi gazetteer covers the arecanut yards only.
