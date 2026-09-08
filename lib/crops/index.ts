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

/** Expected yield per acre for a crop at a given planting age. */
export function yieldPerAcre(crop: CropConfig, plantedYear: number, today = new Date()): number {
  if (crop.yield.kind === "seasonal") return crop.yield.qtlPerAcre;

  const age = today.getFullYear() - plantedYear;
  let value = 0;
  for (const point of crop.yield.curve) {
    if (age >= point.fromAge) value = point.qtlPerAcre;
  }
  const { declineFromAge, declinePerYear } = crop.yield;
  if (declineFromAge && declinePerYear && age > declineFromAge) {
    value = Math.max(value * 0.3, value - (age - declineFromAge) * declinePerYear);
  }
  return value;
}
