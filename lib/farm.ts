"use client";

import type { CostEntry, Farm } from "./types";

/**
 * Offline-first local store.
 *
 * Farmers work in patchy 4G, often under canopy, so the farm profile, cost book
 * and last-known plan all live in localStorage and the app renders fully without
 * a network. Server sync is a later concern; nothing here blocks on it.
 */

const FARM_KEY = "kheti.farm.v2";
const COSTS_KEY = "kheti.costs.v1";

/** A realistic Dakshina Kannada arecanut garden, for first run and demos. */
export const DEMO_FARM: Farm = {
  id: "demo",
  ownerName: "Suresh Bhat",
  cropId: "arecanut",
  lat: 12.7597,
  lon: 75.2,
  village: "Kabaka",
  district: "Dakshina Kannada",
  state: "Karnataka",
  acres: 3,
  plantedYear: 2014,
  irrigation: "sprinkler",
  soil: "laterite",
  lang: "en",
  lastIrrigatedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  lastSprayAt: { koleroga: new Date(Date.now() - 44 * 86_400_000).toISOString() },
  stockQtl: { rashi: 12, hosa_chali: 5 },
};

export const DEMO_COSTS: CostEntry[] = [
  { id: "c1", farmId: "demo", date: "2026-06-02", category: "fertilizer", amount: 42000, note: "NPK + dolomite" },
  { id: "c2", farmId: "demo", date: "2026-06-18", category: "labour", amount: 68000, note: "Climbers, 3 rounds" },
  { id: "c3", farmId: "demo", date: "2026-07-04", category: "pesticide", amount: 14500, note: "Bordeaux, copper sulphate" },
  { id: "c4", farmId: "demo", date: "2026-08-11", category: "irrigation", amount: 9800, note: "Pump repair + power" },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full quota — the app still works for this session.
  }
}

/**
 * An empty farm for somebody signing up for the first time.
 *
 * Onboarding must NOT start from DEMO_FARM. Seeding a new grower with the
 * demo's 3 acres planted in 2014 told the engine they owned a mature bearing
 * plantation, and the app duly projected lakhs of revenue to a farmer who had
 * just put seedlings in the ground. Blank fields that must be filled are the
 * only honest default.
 */
export function blankFarm(ownerName = ""): Farm {
  return {
    id: "new",
    ownerName,
    cropId: "arecanut",
    lat: 0,
    lon: 0,
    village: "",
    district: "",
    state: "Karnataka",
    acres: 0,
    plantedYear: 0,
    irrigation: "sprinkler",
    soil: "laterite",
    lang: "en",
    stockQtl: {},
    lastSprayAt: {},
  };
}

/** True once a farm profile has actually been saved on this device. */
export function hasFarm(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FARM_KEY) !== null;
  } catch {
    return false;
  }
}

export const loadFarm = (): Farm => read(FARM_KEY, DEMO_FARM);
export const saveFarm = (farm: Farm): void => write(FARM_KEY, farm);
/**
 * The seeded cost book belongs to the demo garden only. A farmer who has just
 * completed onboarding starts empty — inheriting somebody else's ₹1.34 lakh of
 * arecanut expenses would poison every number on the profit screen.
 */
export const loadCosts = (): CostEntry[] =>
  read(COSTS_KEY, loadFarm().id === "demo" ? DEMO_COSTS : []);
export const saveCosts = (costs: CostEntry[]): void => write(COSTS_KEY, costs);

/** Turn the pre-filled demo profile into this farmer's own farm. */
export function claimFarm(farm: Farm, ownerName: string): Farm {
  if (farm.id !== "demo" && farm.id !== "new") return farm;
  return { ...farm, id: `farm-${Date.now().toString(36)}`, ownerName };
}

export function addCost(entry: Omit<CostEntry, "id">): CostEntry[] {
  const next = [...loadCosts(), { ...entry, id: `c${Date.now()}` }];
  saveCosts(next);
  return next;
}

/**
 * Switching crop invalidates stock and spray history — they were grades and
 * diseases belonging to the old crop. Clearing them is the honest move; keeping
 * "12 qtl of Rashi" against a tomato farm would produce confident nonsense.
 */
export function switchCrop(farm: Farm, cropId: string): Farm {
  if (farm.cropId === cropId) return farm;
  return { ...farm, cropId, stockQtl: {}, lastSprayAt: {}, plantedOn: undefined };
}
