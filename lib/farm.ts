"use client";

import type { CostEntry, Farm } from "./types";

/**
 * Offline-first local store.
 *
 * Farmers in the arecanut belt work in patchy 4G under a canopy, so the farm
 * profile, cost book and last-known plan all live in localStorage and the app
 * renders fully without a network. Server sync is a later concern; nothing here
 * blocks on it. Swap this module for an IndexedDB-backed store when the cost
 * book outgrows a few hundred rows.
 */

const FARM_KEY = "kheti.farm.v1";
const COSTS_KEY = "kheti.costs.v1";

/** A realistic Dakshina Kannada garden, used for first run and for demos. */
export const DEMO_FARM: Farm = {
  id: "demo",
  ownerName: "Suresh Bhat",
  lat: 12.7597,
  lon: 75.2,
  village: "Kabaka",
  district: "Dakshina Kannada",
  acres: 3,
  plantedYear: 2014,
  grades: ["rashi", "hosa_chali"],
  irrigation: "sprinkler",
  soil: "laterite",
  lang: "en",
  lastIrrigatedAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
  lastSprayAt: new Date(Date.now() - 44 * 86_400_000).toISOString(),
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

export const loadFarm = (): Farm => read(FARM_KEY, DEMO_FARM);
export const saveFarm = (farm: Farm): void => write(FARM_KEY, farm);
export const loadCosts = (): CostEntry[] => read(COSTS_KEY, DEMO_COSTS);
export const saveCosts = (costs: CostEntry[]): void => write(COSTS_KEY, costs);

export function addCost(entry: Omit<CostEntry, "id">): CostEntry[] {
  const costs = loadCosts();
  const next = [...costs, { ...entry, id: `c${Date.now()}` }];
  saveCosts(next);
  return next;
}
