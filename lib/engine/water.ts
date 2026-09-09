import { kcFor, LITRES_PER_MM_PER_ACRE, RAIN_EFFECTIVENESS } from "../crops/water";
import { plantingFor } from "../crops/planting";
import type { Farm, WeatherWindow } from "../types";

/**
 * How much water the garden actually needs.
 *
 * This is the one thing on the home screen a farmer cannot work out for
 * themselves. "Seven days since you watered" is something they already know and
 * telling them is worthless. How much water the sun and wind took out of their
 * soil over those seven days, and how much of the rain actually reached the
 * roots, is arithmetic over data they have no access to.
 *
 *   used    = reference evapotranspiration × crop coefficient
 *   gained  = rainfall × effectiveness
 *   deficit = used − gained
 *
 * The result is expressed per plant as well as in millimetres, because nobody
 * waters in millimetres — they water a palm.
 */

export interface WaterBalance {
  /** Days the balance was computed over. */
  days: number;
  /** What the crop transpired, mm. */
  usedMm: number;
  /** What the rain actually delivered, mm. */
  rainMm: number;
  /** Shortfall, mm. Negative means the rain more than covered it. */
  deficitMm: number;
  /** Litres per plant to close the gap, when the crop is counted in plants. */
  litresPerPlant?: number;
  /** Total litres across the holding. */
  totalLitres: number;
  /** Rain expected over the next two days, mm. */
  rainAheadMm: number;
  /** True when rain ahead covers the deficit, so irrigating today is wasted. */
  rainWillCover: boolean;
}

export function waterBalance(farm: Farm, wx: WeatherWindow): WaterBalance | null {
  const past = wx.past ?? [];
  if (past.length === 0) return null;

  const kc = kcFor(farm.cropId);
  const usedMm = past.reduce((sum, d) => sum + (d.et0Mm ?? 0) * kc, 0);
  const rainMm = past.reduce((sum, d) => sum + d.rainMm, 0) * RAIN_EFFECTIVENESS;
  const deficitMm = usedMm - rainMm;

  const rainAheadMm = wx.days.slice(0, 2).reduce((sum, d) => sum + d.rainMm, 0);
  const rainWillCover = rainAheadMm * RAIN_EFFECTIVENESS >= deficitMm;

  const totalLitres = Math.max(0, deficitMm) * LITRES_PER_MM_PER_ACRE * farm.acres;
  const planting = plantingFor(farm.cropId);
  const plants = farm.plantCount ?? (planting ? planting.perAcre * farm.acres : 0);

  return {
    days: past.length,
    usedMm: Math.round(usedMm * 10) / 10,
    rainMm: Math.round(rainMm * 10) / 10,
    deficitMm: Math.round(deficitMm * 10) / 10,
    ...(plants > 0 ? { litresPerPlant: Math.round(totalLitres / plants) } : {}),
    totalLitres: Math.round(totalLitres),
    rainAheadMm: Math.round(rainAheadMm * 10) / 10,
    rainWillCover,
  };
}
