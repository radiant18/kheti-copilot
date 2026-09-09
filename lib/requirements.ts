import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * What buyers are ready to buy.
 *
 * The board previously had only one side: farmers offering lots, waiting to be
 * found. That leaves the grower doing all the work and still guessing whether
 * anyone wants the crop at all. A requirement is the mirror image — a trader,
 * mill, FPO or exporter saying "I will take 200 quintals of Rashi at ₹51,500" —
 * so a farmer opens the app and sees actual demand with a price against it.
 *
 * Between the two sides and today's mandi modal, a grower can finally see all
 * three numbers that decide what a lot is worth: what the yard pays, what a
 * buyer offers, and what other growers are asking.
 *
 * Same consent rule as listings: a phone number appears only because the buyer
 * ticked the box. Same storage caveat as lib/subscribers.ts — file-backed,
 * fine locally, needs a real database on serverless.
 */

export interface Requirement {
  id: string;
  createdAt: string;
  /** Trading name, which is what a farmer will recognise. */
  business: string;
  contactName: string;
  /** Published only with explicit consent at post time. */
  phone: string;
  cropId: string;
  /** Empty means any grade of this crop. */
  grade: string;
  /** Quintals wanted. */
  quintals: number;
  /** Rupees per quintal the buyer is offering. */
  offerPerQtl: number;
  district: string;
  state: string;
  note?: string;
  status: "open" | "closed";
}

const STORE = path.join(process.cwd(), ".data", "requirements.json");

async function readAll(): Promise<Requirement[]> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8")) as Requirement[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Requirement[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(rows, null, 2), "utf8");
}

export async function listOpenRequirements(filter?: {
  cropId?: string;
  state?: string;
}): Promise<Requirement[]> {
  const rows = await readAll();
  return rows
    .filter((r) => r.status === "open")
    .filter((r) => (filter?.cropId ? r.cropId === filter.cropId : true))
    .filter((r) => (filter?.state ? r.state === filter.state : true))
    // Best price first: that is the order a farmer wants to read them in.
    .sort((a, b) => b.offerPerQtl - a.offerPerQtl);
}

export async function requirementsByPhone(phone: string): Promise<Requirement[]> {
  const rows = await readAll();
  return rows.filter((r) => r.phone === phone).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createRequirement(
  input: Omit<Requirement, "id" | "createdAt" | "status">,
): Promise<Requirement> {
  const rows = await readAll();
  const req: Requirement = {
    ...input,
    id: `req-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  await writeAll([...rows, req]);
  return req;
}

/** Only the buyer who posted it may close a requirement. */
export async function closeRequirement(id: string, phone: string): Promise<boolean> {
  const rows = await readAll();
  const row = rows.find((r) => r.id === id);
  if (!row || row.phone !== phone) return false;
  await writeAll(rows.map((r) => (r.id === id ? { ...r, status: "closed" as const } : r)));
  return true;
}
