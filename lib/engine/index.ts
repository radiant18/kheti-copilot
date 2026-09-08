import { getCrop, harvestOutlook } from "../crops";
import type { CostEntry, Farm, FarmPlan, MarketView, Recommendation, WeatherWindow } from "../types";
import { agronomyPlan } from "./agronomy";
import { economics, referencePrice, sellAdvice } from "./market";

const SEVERITY_ORDER = { urgent: 0, act: 1, watch: 2, info: 3 } as const;

/**
 * Compose the day's plan for whatever crop this farm grows.
 *
 * Ordering is urgency first, then rupees at stake — a farmer opening the app
 * before dawn should see the thing that costs the most money to ignore at the
 * top of the screen.
 */
export function buildPlan(
  farm: Farm,
  wx: WeatherWindow,
  market: MarketView | null,
  costs: CostEntry[],
  today = new Date(),
): FarmPlan {
  const crop = getCrop(farm.cropId);
  const price = referencePrice(farm, market);
  // The rupee figure on a spray warning is only as good as the yield behind it,
  // so the farmer's own number wins here too.
  const expectedQtl =
    harvestOutlook(crop, farm.plantedYear, farm.plantedOn, today, farm.expectedQtlPerAcre)
      .qtlPerAcre * farm.acres;

  const recommendations: Recommendation[] = [
    ...agronomyPlan(farm, crop, wx, price, expectedQtl, today),
    ...sellAdvice(farm, crop, market),
  ].sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return Math.abs(b.rupeeImpact ?? 0) - Math.abs(a.rupeeImpact ?? 0);
  });

  return {
    generatedAt: today.toISOString(),
    farmId: farm.id,
    recommendations,
    weather: wx,
    market,
    economics: economics(farm, market, costs.reduce((sum, c) => sum + c.amount, 0)),
  };
}

export * from "./agronomy";
export * from "./market";
