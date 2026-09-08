import { CROPS, OTHER_COMMODITIES, genericCrop } from "./registry";
import type { CropConfig } from "./types";

export * from "./types";
export { CROPS, OTHER_COMMODITIES };

export interface CropOption {
  id: string;
  en: string;
  kn: string;
  depth: CropConfig["depth"];
}

/** Everything a farmer can pick, modelled crops first. */
export function listCrops(): CropOption[] {
  return [
    ...CROPS.map((c) => ({ id: c.id, en: c.name.en, kn: c.name.kn, depth: c.depth })),
    ...OTHER_COMMODITIES.map((c) => ({
      id: c.id,
      en: c.en,
      kn: c.kn,
      depth: "basic" as const,
    })),
  ];
}

/** Never throws — an unknown id degrades to a generic crop rather than a crash. */
export function getCrop(id: string): CropConfig {
  const modelled = CROPS.find((c) => c.id === id);
  if (modelled) return modelled;

  const other = OTHER_COMMODITIES.find((c) => c.id === id);
  if (other) return genericCrop(other.id, other.en, other.kn, other.commodity);

  return genericCrop(id, id, id, id);
}

function slug(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/**
 * Map an Agmarknet variety string onto a grade id.
 *
 * For a crop with declared grades, an unrecognised variety returns null and the
 * quote is dropped — a wrong grade means wrong money. For a crop with no
 * declared grades we accept whatever the feed says, so arbitrage still works
 * on crops nobody has curated yet.
 */
export function normaliseGrade(crop: CropConfig, raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (crop.grades.length === 0) return key ? slug(key) : "standard";
  return crop.grades.find((g) => g.aliases.includes(key))?.id ?? null;
}

export function gradeLabel(crop: CropConfig, gradeId: string): string {
  const declared = crop.grades.find((g) => g.id === gradeId);
  if (declared) return declared.label.en;
  // Undeclared grades come straight from the feed; make them readable.
  return gradeId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface HarvestOutlook {
  /** Quintals per acre expected from the crop that is actually in the ground. */
  qtlPerAcre: number;
  /** False while the crop is too young to have produced anything. */
  bearing: boolean;
  /** When the first harvest is expected. ISO date for seasonals, year for perennials. */
  firstHarvestOn: string | null;
}

/**
 * What this planting will actually yield, and when.
 *
 * The distinction matters: a perennial is judged by its age in years, a
 * seasonal by days since sowing against its cycle length. Getting this wrong
 * told a farmer who had just planted banana that he had 360 quintals in hand.
 * Until a crop is bearing, the honest expected yield is zero.
 */
export function harvestOutlook(
  crop: CropConfig,
  plantedYear: number,
  plantedOn?: string,
  today = new Date(),
  /**
   * The grower's own quintals-per-acre. Always wins over the registry figure,
   * which is a national ballpark that can be out by a factor of three on any
   * particular block. It does not override *timing*: an override cannot make a
   * crop bear before it is planted or ripe.
   */
  overrideQtlPerAcre?: number,
): HarvestOutlook {
  if (crop.yield.kind === "seasonal") {
    const { qtlPerAcre, cycleDays } = crop.yield;

    // Without a sowing date we cannot say whether the cycle has completed, and
    // guessing in the farmer's favour is exactly the mistake we are fixing.
    if (!plantedOn) return { qtlPerAcre: 0, bearing: false, firstHarvestOn: null };

    const sown = Date.parse(plantedOn);
    if (Number.isNaN(sown)) return { qtlPerAcre: 0, bearing: false, firstHarvestOn: null };

    const harvestAt = new Date(sown + cycleDays * 86_400_000);
    const bearing = today.getTime() >= harvestAt.getTime();
    return {
      qtlPerAcre: bearing ? (overrideQtlPerAcre ?? qtlPerAcre) : 0,
      bearing,
      firstHarvestOn: harvestAt.toISOString().slice(0, 10),
    };
  }

  const age = today.getFullYear() - plantedYear;
  const firstBearingAge = crop.yield.curve[0]?.fromAge ?? 0;

  let value = 0;
  for (const point of crop.yield.curve) {
    if (age >= point.fromAge) value = point.qtlPerAcre;
  }

  const { declineFromAge, declinePerYear } = crop.yield;
  if (declineFromAge && declinePerYear && age > declineFromAge) {
    value = Math.max(value * 0.3, value - (age - declineFromAge) * declinePerYear);
  }

  const bearing = value > 0;
  return {
    qtlPerAcre: bearing ? (overrideQtlPerAcre ?? value) : 0,
    bearing,
    firstHarvestOn: bearing ? null : String(plantedYear + firstBearingAge),
  };
}

/** Convenience wrapper for callers that only need the number. */
/** The registry's estimate for a mature/complete crop, ignoring timing. */
export function estimatedQtlPerAcre(crop: CropConfig): number {
  if (crop.yield.kind === "seasonal") return crop.yield.qtlPerAcre;
  return crop.yield.curve.reduce((max, p) => Math.max(max, p.qtlPerAcre), 0);
}

export function yieldPerAcre(
  crop: CropConfig,
  plantedYear: number,
  plantedOn?: string,
  today = new Date(),
): number {
  return harvestOutlook(crop, plantedYear, plantedOn, today).qtlPerAcre;
}
