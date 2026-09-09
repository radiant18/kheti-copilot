import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Lots farmers are offering directly to buyers.
 *
 * The point is to skip the commission agent, so the only thing this has to do
 * well is put a buyer in touch with a grower and show both of them what the
 * mandi is paying for the same grade today. That reference price is the actual
 * protection: a grower who can see the yard is paying ₹50,891 does not accept
 * ₹44,000 from a trader who says the market is soft.
 *
 * DELIBERATELY NOT HERE: payments, escrow, delivery, grading arbitration.
 * Standing between two people's money needs a licence, a dispute process and
 * insurance, none of which an app can improvise. This introduces them and gets
 * out of the way.
 *
 * A phone number appears on a listing only because the farmer chose to publish
 * it — see the consent flag on the post form. Listings are unverified and the
 * UI says so; anyone can post, and a buyer must do their own diligence.
 *
 * STORAGE: same caveat as lib/subscribers.ts — file-backed, works locally and
 * on a normal server, needs a real database on serverless.
 */

export interface Listing {
  id: string;
  createdAt: string;
  farmerName: string;
  /** Published only with explicit consent at post time. */
  phone: string;
  cropId: string;
  grade: string;
  quintals: number;
  /** What the farmer is asking, rupees per quintal. */
  askPerQtl: number;
  village: string;
  district: string;
  state: string;
  /** ISO date the lot can be collected, if not already ready. */
  readyOn?: string;
  note?: string;
  status: "open" | "sold" | "withdrawn";
}

const STORE = path.join(process.cwd(), ".data", "listings.json");

async function readAll(): Promise<Listing[]> {
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8")) as Listing[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Listing[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(rows, null, 2), "utf8");
}

export async function listOpen(filter?: { cropId?: string; state?: string }): Promise<Listing[]> {
  const rows = await readAll();
  return rows
    .filter((r) => r.status === "open")
    .filter((r) => (filter?.cropId ? r.cropId === filter.cropId : true))
    .filter((r) => (filter?.state ? r.state === filter.state : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listByPhone(phone: string): Promise<Listing[]> {
  const rows = await readAll();
  return rows.filter((r) => r.phone === phone).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createListing(
  input: Omit<Listing, "id" | "createdAt" | "status">,
): Promise<Listing> {
  const rows = await readAll();
  const listing: Listing = {
    ...input,
    id: `lot-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  await writeAll([...rows, listing]);
  return listing;
}

/** Only the farmer who posted a lot may change it, matched on their number. */
export async function setStatus(
  id: string,
  phone: string,
  status: Listing["status"],
): Promise<boolean> {
  const rows = await readAll();
  const row = rows.find((r) => r.id === id);
  if (!row || row.phone !== phone) return false;
  await writeAll(rows.map((r) => (r.id === id ? { ...r, status } : r)));
  return true;
}
