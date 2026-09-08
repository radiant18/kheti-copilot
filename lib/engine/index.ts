import type { CostEntry, Farm, FarmPlan, MarketView, Recommendation, WeatherWindow } from "../types";
import { agronomyPlan } from "./agronomy";
import { economics, sellAdvice } from "./market";

const SEVERITY_ORDER = { urgent: 0, act: 1, watch: 2, info: 3 } as const;

/**
 * Compose the whole day's plan. Ordering is by urgency, then by rupee impact —
 * a farmer opening the app before dawn should see the thing that costs the most
 * money to ignore at the top of the screen.
 */
export function buildPlan(
  farm: Farm,
  wx: WeatherWindow,
  market: MarketView | null,
  costs: CostEntry[],
  today = new Date(),
): FarmPlan {
  const recommendations: Recommendation[] = [
    ...agronomyPlan(farm, wx, today),
    ...sellAdvice(farm, market),
  ].sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return Math.abs(b.rupeeImpact ?? 0) - Math.abs(a.rupeeImpact ?? 0);
  });

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);

  return {
    generatedAt: today.toISOString(),
    farmId: farm.id,
    recommendations,
    weather: wx,
    market,
    economics: economics(farm, market, totalCosts),
  };
}

export * from "./agronomy";
export * from "./market";
