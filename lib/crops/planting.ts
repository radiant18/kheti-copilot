/**
 * How many plants stand on an acre, by crop.
 *
 * An arecanut grower knows their garden as "twelve hundred mara". Ask them for
 * acreage and they have to work it out — or guess, which then quietly wrecks
 * every yield and profit figure downstream. So for crops that are counted, the
 * app asks for the count and derives the area itself.
 *
 * Densities are standard spacings from Indian horticultural practice. They are
 * approximations: a garden on a slope or an old block replanted piecemeal will
 * differ, which is why the setup screen shows the derived acreage back to the
 * farmer so an obviously wrong number can be caught.
 *
 * Crops absent from this map are counted by area, because nobody counts wheat.
 */

import { t, type Lang } from "../i18n";

export type PlantUnit = "palms" | "trees" | "plants" | "vines";

export interface Planting {
  perAcre: number;
  unit: PlantUnit;
  /** Typical spacing, shown so a grower can sanity-check the conversion. */
  spacing: string;
}

export const PLANTING: Record<string, Planting> = {
  // Palms
  arecanut: { perAcre: 560, unit: "palms", spacing: "2.7 × 2.7 m" },
  coconut: { perAcre: 70, unit: "palms", spacing: "7.5 × 7.5 m" },
  oil_palm: { perAcre: 57, unit: "palms", spacing: "9 m triangular" },

  // Plantation
  cocoa: { perAcre: 450, unit: "trees", spacing: "3 × 3 m" },
  coffee: { perAcre: 1000, unit: "plants", spacing: "2 × 2 m" },
  cashew: { perAcre: 80, unit: "trees", spacing: "7 × 7 m" },
  rubber: { perAcre: 180, unit: "trees", spacing: "4.9 × 4.9 m" },
  black_pepper: { perAcre: 450, unit: "vines", spacing: "3 × 3 m on standards" },
  cardamom: { perAcre: 1000, unit: "plants", spacing: "2 × 2 m" },

  // Orchard
  mango: { perAcre: 40, unit: "trees", spacing: "10 × 10 m" },
  jackfruit: { perAcre: 40, unit: "trees", spacing: "10 × 10 m" },
  tamarind: { perAcre: 40, unit: "trees", spacing: "10 × 10 m" },
  litchi: { perAcre: 40, unit: "trees", spacing: "10 × 10 m" },
  sapota: { perAcre: 63, unit: "trees", spacing: "8 × 8 m" },
  amla: { perAcre: 63, unit: "trees", spacing: "8 × 8 m" },
  guava: { perAcre: 110, unit: "trees", spacing: "6 × 6 m" },
  orange: { perAcre: 110, unit: "trees", spacing: "6 × 6 m" },
  sweet_lime: { perAcre: 110, unit: "trees", spacing: "6 × 6 m" },
  lemon: { perAcre: 110, unit: "trees", spacing: "6 × 6 m" },
  custard_apple: { perAcre: 160, unit: "trees", spacing: "5 × 5 m" },
  fig: { perAcre: 160, unit: "trees", spacing: "5 × 5 m" },
  apple: { perAcre: 250, unit: "trees", spacing: "4 × 4 m" },
  pear: { perAcre: 250, unit: "trees", spacing: "4 × 4 m" },
  peach: { perAcre: 250, unit: "trees", spacing: "4 × 4 m" },
  plum: { perAcre: 250, unit: "trees", spacing: "4 × 4 m" },
  ber: { perAcre: 100, unit: "trees", spacing: "6 × 6 m" },
  pomegranate: { perAcre: 300, unit: "plants", spacing: "4.5 × 3 m" },
  grapes: { perAcre: 670, unit: "vines", spacing: "3 × 2 m" },

  // Counted, but not trees
  banana: { perAcre: 1200, unit: "plants", spacing: "1.8 × 1.8 m" },
  papaya: { perAcre: 1000, unit: "plants", spacing: "2 × 2 m" },
  drumstick: { perAcre: 640, unit: "trees", spacing: "2.5 × 2.5 m" },
};

export const plantingFor = (cropId: string): Planting | undefined => PLANTING[cropId];

/** Area a given number of plants occupies, rounded to something readable. */
export function acresFromCount(cropId: string, count: number): number {
  const p = plantingFor(cropId);
  if (!p || count <= 0) return 0;
  return Math.round((count / p.perAcre) * 100) / 100;
}

export function countFromAcres(cropId: string, acres: number): number {
  const p = plantingFor(cropId);
  if (!p || acres <= 0) return 0;
  return Math.round(acres * p.perAcre);
}

/**
 * How to describe the size of a farm to its owner.
 *
 * Someone who told us "1,680 palms" should be shown 1,680 palms, not the 3
 * acres we derived from it. The derived acreage is the engine's business.
 */
export function farmSizeLabel(
  farm: { cropId: string; acres: number; plantCount?: number },
  lang: Lang,
): string {
  const p = plantingFor(farm.cropId);
  if (p && farm.plantCount) {
    return `${farm.plantCount.toLocaleString("en-IN")} ${t(lang, UNIT_KEYS[p.unit])}`;
  }
  return `${farm.acres} ${t(lang, farm.acres === 1 ? "acre" : "acres")}`;
}

const UNIT_KEYS: Record<PlantUnit, string> = {
  palms: "unitPalms",
  trees: "unitTrees",
  plants: "unitPlants",
  vines: "unitVines",
};
