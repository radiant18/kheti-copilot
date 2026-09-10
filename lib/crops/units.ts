import { plantingFor, type PlantUnit } from "./planting";

/**
 * How a farmer states the size of their holding.
 *
 * Nobody in coastal Karnataka says "three point two five acres". They say
 * thirty guntas, or a hundred and twenty cents, or twelve hundred mara — and
 * which one depends on the district and on whether they are reading their RTC
 * or looking at the garden. Insisting on one unit makes the farmer do a
 * conversion before they have even started, and a guessed conversion quietly
 * wrecks every yield and water figure downstream.
 *
 * So they answer in whatever they know and the app converts. Acres stay the
 * engine's unit throughout; this is purely the doorway.
 */

export type SizeUnit = "acre" | "gunta" | "cent" | "hectare" | "plant";

/** Acres in one of each unit. Karnataka land records use guntas and cents. */
export const ACRES_PER: Record<Exclude<SizeUnit, "plant">, number> = {
  acre: 1,
  gunta: 1 / 40,
  cent: 1 / 100,
  hectare: 2.47105,
};

export const UNIT_LABEL_KEY: Record<Exclude<SizeUnit, "plant">, string> = {
  acre: "unitAcre",
  gunta: "unitGunta",
  cent: "unitCent",
  hectare: "unitHectare",
};

/** Units offered for a crop — plants only where the crop is actually counted. */
export function unitsFor(cropId: string): SizeUnit[] {
  const base: SizeUnit[] = ["acre", "gunta", "cent", "hectare"];
  return plantingFor(cropId) ? [...base, "plant"] : base;
}

/** The plant word for this crop, so the chip reads "palms" not "plants". */
export function plantUnitFor(cropId: string): PlantUnit | null {
  return plantingFor(cropId)?.unit ?? null;
}

export function toAcres(cropId: string, unit: SizeUnit, value: number): number {
  if (value <= 0) return 0;
  if (unit === "plant") {
    const p = plantingFor(cropId);
    return p ? Math.round((value / p.perAcre) * 100) / 100 : 0;
  }
  return Math.round(value * ACRES_PER[unit] * 100) / 100;
}

export function fromAcres(cropId: string, unit: SizeUnit, acres: number): number {
  if (acres <= 0) return 0;
  if (unit === "plant") {
    const p = plantingFor(cropId);
    return p ? Math.round(acres * p.perAcre) : 0;
  }
  return Math.round((acres / ACRES_PER[unit]) * 100) / 100;
}
