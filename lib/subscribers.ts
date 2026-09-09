import { promises as fs } from "node:fs";
import path from "node:path";
import type { CostEntry, Farm } from "./types";
import type { Lang } from "./i18n";

/**
 * Who gets the 5am message, and everything needed to build it for them.
 *
 * This is the part the app did not previously have. Every farm lives in the
 * farmer's own localStorage, which is fine while the phone is doing the work —
 * but a job that runs at 5am while the phone is asleep needs the farm profile
 * on the server. So a farmer who opts in sends a copy of their profile here.
 *
 * STORAGE, HONESTLY: the file store below works on a normal server and in
 * development. It will NOT work on serverless hosting — Vercel's filesystem is
 * read-only and per-invocation, so writes vanish and the cron job reads an
 * empty list. Before this ships, replace readAll/writeAll with a real database
 * (Postgres, Redis, Vercel KV — anything durable). The rest of the pipeline is
 * written against these two functions precisely so that swap is small.
 *
 * CONSENT: a row exists here only because the farmer switched the setting on,
 * and disappears when they switch it off. WhatsApp requires opt-in for
 * business-initiated messages and so does basic decency — never insert a row
 * from anywhere except an explicit request by that farmer.
 */

export interface Subscriber {
  /** 10-digit Indian mobile, as entered at sign-in. */
  phone: string;
  name: string;
  lang: Lang;
  farm: Farm;
  /** The cost book, so the 5am message can quote the same profit the app shows. */
  costs: CostEntry[];
  /** When they turned the daily message on. */
  subscribedAt: string;
  /** ISO date of the last successful send, so a retry cannot double-send. */
  lastSentOn?: string;
}

const STORE = path.join(process.cwd(), ".data", "subscribers.json");

async function readAll(): Promise<Subscriber[]> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8")) as Subscriber[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Subscriber[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(rows, null, 2), "utf8");
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return readAll();
}

/** Opt in, or refresh a stored profile after the farmer edits their farm. */
export async function subscribe(
  input: Omit<Subscriber, "subscribedAt" | "lastSentOn">,
): Promise<void> {
  const rows = await readAll();
  const existing = rows.find((r) => r.phone === input.phone);
  const next: Subscriber = {
    ...input,
    subscribedAt: existing?.subscribedAt ?? new Date().toISOString(),
    ...(existing?.lastSentOn ? { lastSentOn: existing.lastSentOn } : {}),
  };
  await writeAll([...rows.filter((r) => r.phone !== input.phone), next]);
}

export async function unsubscribe(phone: string): Promise<void> {
  const rows = await readAll();
  await writeAll(rows.filter((r) => r.phone !== phone));
}

export async function markSent(phone: string, isoDate: string): Promise<void> {
  const rows = await readAll();
  await writeAll(rows.map((r) => (r.phone === phone ? { ...r, lastSentOn: isoDate } : r)));
}
