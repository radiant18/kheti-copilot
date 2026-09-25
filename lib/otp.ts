import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Proving that a mobile number belongs to whoever is typing it.
 *
 * WHY THIS EXISTS: the direct board publishes a phone number, and until now the
 * number and the consent tick both arrived in the request body. That meant
 * anybody could POST a lot carrying a stranger's number and put it in front of
 * every buyer in the state — the one thing on this board that cannot be undone
 * once somebody has written it down. Consent has to come from the number's
 * owner, so the owner has to be established first.
 *
 * The flow: the app asks for a code, we send six digits to that number over
 * WhatsApp, and on a correct code we hand back a signed token naming the phone.
 * Every route that publishes or messages a number reads the phone off that
 * token and ignores whatever the body claims.
 *
 * This is still not user authentication — it says "this number was reachable by
 * whoever holds this token", not "this is Suresh Bhat". It is exactly the claim
 * the board needs and no more.
 *
 * STORAGE, HONESTLY: pending codes live in the process's memory below. That is
 * the right lifetime for a five-minute secret and it works in development and
 * on a normal server, but it will NOT work on serverless — each invocation gets
 * its own memory, so the code issued by one is unknown to the one that verifies
 * it. Same swap as lib/subscribers.ts: Redis or Vercel KV behind the two
 * functions, keyed by phone with a TTL. Issued tokens are unaffected; they are
 * signed rather than stored, so they survive any restart.
 */

const CODE_TTL_MS = 5 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;
/** A farmer should not re-verify every week just to withdraw a lot. */
const PROOF_TTL_MS = 30 * 86_400_000;

interface Pending {
  /** Hashed: a memory dump or a log line should not hand over live codes. */
  hash: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
}

const pending = new Map<string, Pending>();

const hashCode = (phone: string, code: string): string =>
  createHash("sha256").update(`${phone}:${code}`).digest("hex");

/**
 * Signing key. Without one the token is forgeable, which would leave the board
 * exactly as open as it was before — so in production a missing key is a hard
 * stop rather than a fallback. In development it uses a known constant so the
 * flow runs with no setup.
 */
const DEV_SECRET = "kheti-development-only-signing-key";

export function isConfigured(): boolean {
  return Boolean(process.env.OTP_SECRET) || process.env.NODE_ENV !== "production";
}

function secret(): string {
  const configured = process.env.OTP_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("OTP_SECRET is not set — refusing to sign a forgeable token");
  }
  return DEV_SECRET;
}

const b64url = (buf: Buffer): string => buf.toString("base64url");

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: "too_soon"; retryInSec: number };

/**
 * Make a code for this number, or refuse if one went out moments ago.
 *
 * The cooldown is the only thing standing between this endpoint and somebody
 * using it to send a stranger repeated messages, so it is per number and it
 * applies before anything is sent.
 */
export function issueCode(phone: string, now = Date.now()): IssueResult {
  const existing = pending.get(phone);
  if (existing && now - existing.sentAt < RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      reason: "too_soon",
      retryInSec: Math.ceil((RESEND_COOLDOWN_MS - (now - existing.sentAt)) / 1000),
    };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  pending.set(phone, {
    hash: hashCode(phone, code),
    expiresAt: now + CODE_TTL_MS,
    sentAt: now,
    attempts: 0,
  });
  return { ok: true, code };
}

export type CheckResult = "ok" | "wrong" | "expired" | "too_many";

/**
 * Check a typed code. A correct one is spent immediately, and so is a code that
 * has been guessed at five times — otherwise a five-minute window with
 * unlimited tries is six digits of nothing.
 */
export function checkCode(phone: string, code: string, now = Date.now()): CheckResult {
  const entry = pending.get(phone);
  if (!entry || entry.expiresAt < now) {
    pending.delete(phone);
    return "expired";
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    pending.delete(phone);
    return "too_many";
  }

  entry.attempts += 1;
  const got = Buffer.from(hashCode(phone, code.replace(/\D/g, "")));
  const want = Buffer.from(entry.hash);
  if (got.length !== want.length || !timingSafeEqual(got, want)) {
    if (entry.attempts >= MAX_ATTEMPTS) pending.delete(phone);
    return "wrong";
  }

  pending.delete(phone);
  return "ok";
}

/** A signed statement that this number answered a code. */
export function mintProof(phone: string, now = Date.now()): string {
  const payload = b64url(Buffer.from(JSON.stringify({ p: phone, e: now + PROOF_TTL_MS })));
  const sig = b64url(createHmac("sha256", secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

/** The number a token vouches for, or null if it is forged, stale or malformed. */
export function phoneFromProof(token: string | null | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  try {
    const want = Buffer.from(b64url(createHmac("sha256", secret()).update(payload).digest()));
    const got = Buffer.from(sig);
    if (got.length !== want.length || !timingSafeEqual(got, want)) return null;

    const { p, e } = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      p?: string;
      e?: number;
    };
    if (!p || !e || e < now) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * The verified number behind a request, read from the Authorization header.
 * Routes that publish or message a number use this instead of the body, which
 * is the whole point: a caller can claim any number, but only the owner of one
 * holds a token for it.
 */
export function verifiedPhone(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  return phoneFromProof(token);
}
