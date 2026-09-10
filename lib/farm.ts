"use client";

import type { CostEntry, Farm } from "./types";

/**
 * Offline-first local store for a grower's plots.
 *
 * A farmer rarely grows one thing. Coastal gardens carry arecanut with pepper
 * on the standards and cocoa underneath; a Kolar farmer runs tomato and ragi in
 * different blocks. Each plot is its own Farm with its own crop, acreage,
 * planting date, stock and cost book, and one of them is active at a time.
 *
 * Everything lives in localStorage: gardens sit under canopy on patchy 4G, so
 * the app has to render fully with no network. Server sync is a later concern.
 */

const FARMS_KEY = "kheti.farms.v1";
const ACTIVE_KEY = "kheti.activeFarm.v1";
const COSTS_KEY = "kheti.costs.v1";
/** Pre-multi-plot key, migrated on first read and then left alone. */
const LEGACY_FARM_KEY = "kheti.farm.v2";

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
  plantCount: 1680,
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

/** An empty plot for somebody adding their first, or another, crop. */
export function blankFarm(ownerName = "", template?: Farm): Farm {
  return {
    id: "new",
    ownerName,
    cropId: "arecanut",
    // A second plot is nearly always near the first, so inherit the location
    // and let the farmer change it rather than making them find it again.
    lat: template?.lat ?? 0,
    lon: template?.lon ?? 0,
    village: template?.village ?? "",
    district: template?.district ?? "",
    state: template?.state ?? "Karnataka",
    acres: 0,
    plantedYear: 0,
    irrigation: "sprinkler",
    soil: template?.soil ?? "laterite",
    lang: template?.lang ?? "en",
    stockQtl: {},
    lastSprayAt: {},
  };
}

/**
 * Read all plots, migrating a single pre-existing farm into the collection.
 * The legacy key is left in place rather than deleted, so a downgrade or a
 * half-finished migration cannot lose somebody's only farm.
 */
export function loadFarms(): Farm[] {
  const farms = read<Farm[]>(FARMS_KEY, []);
  if (farms.length > 0) return farms;

  const legacy = read<Farm | null>(LEGACY_FARM_KEY, null);
  if (legacy) {
    write(FARMS_KEY, [legacy]);
    write(ACTIVE_KEY, legacy.id);
    return [legacy];
  }
  return [];
}

export function saveFarms(farms: Farm[]): void {
  write(FARMS_KEY, farms);
}

/** True once at least one plot has been set up on this device. */
export function hasFarm(): boolean {
  return loadFarms().length > 0;
}

export function activeFarmId(): string | null {
  const farms = loadFarms();
  if (farms.length === 0) return null;
  const stored = read<string | null>(ACTIVE_KEY, null);
  return farms.some((f) => f.id === stored) ? stored : farms[0].id;
}

export function setActiveFarm(id: string): void {
  write(ACTIVE_KEY, id);
}

/** The plot every screen is currently showing. Falls back to the demo garden. */
export function loadFarm(): Farm {
  const farms = loadFarms();
  if (farms.length === 0) return DEMO_FARM;
  return farms.find((f) => f.id === activeFarmId()) ?? farms[0];
}

/** Insert or update a plot, and make it the active one. */
export function saveFarm(farm: Farm): Farm {
  const farms = loadFarms();
  const stored: Farm =
    farm.id === "new" || farm.id === "demo"
      ? { ...farm, id: `farm-${Date.now().toString(36)}` }
      : farm;

  const index = farms.findIndex((f) => f.id === stored.id);
  if (index >= 0) farms[index] = stored;
  else farms.push(stored);

  saveFarms(farms);
  setActiveFarm(stored.id);
  return stored;
}

/** Remove a plot and everything recorded against it. */
export function removeFarm(id: string): void {
  saveFarms(loadFarms().filter((f) => f.id !== id));
  saveAllCosts(loadAllCosts().filter((c) => c.farmId !== id));
  const remaining = loadFarms();
  if (remaining.length > 0) setActiveFarm(remaining[0].id);
}

export const loadAllCosts = (): CostEntry[] =>
  read(COSTS_KEY, hasFarm() ? [] : DEMO_COSTS);

export const saveAllCosts = (costs: CostEntry[]): void => write(COSTS_KEY, costs);

/**
 * Costs for the active plot only. Expenses belong to a block, not a person —
 * showing an arecanut garden's labour bill against a tomato plot would make
 * both profit figures meaningless.
 */
export function loadCosts(): CostEntry[] {
  const id = loadFarm().id;
  return loadAllCosts().filter((c) => c.farmId === id);
}

export function addCost(entry: Omit<CostEntry, "id">): CostEntry[] {
  saveAllCosts([...loadAllCosts(), { ...entry, id: `c${Date.now()}` }]);
  return loadCosts();
}

/** Wipe every plot and everything recorded against them. */
export function clearFarmData(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("kheti.") && key !== "kheti.session.v1") {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    /* nothing depends on this succeeding */
  }
}

/**
 * Changing a plot's crop invalidates its stock and spray history — those were
 * grades and diseases belonging to the old crop. Clearing them is the honest
 * move; carrying "12 qtl of Rashi" onto a tomato plot produces confident
 * nonsense on the sell screen.
 */
export function switchCrop(farm: Farm, cropId: string): Farm {
  if (farm.cropId === cropId) return farm;
  return { ...farm, cropId, stockQtl: {}, lastSprayAt: {}, plantedOn: undefined };
}
