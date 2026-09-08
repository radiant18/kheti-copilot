import { getCrop } from "./crops";
import type { Farm, FarmPlan } from "./types";

/**
 * The snapshot the assistant is allowed to reason over.
 *
 * This is the whole safety design. The model never runs the agronomy — it reads
 * what the deterministic engine already decided and puts it into words. Anything
 * absent from this object is something the assistant must say it does not know,
 * which is why the shape is explicit rather than "here is the farm, figure it
 * out". Keep it small: it is re-sent on every question.
 */
export interface AskContext {
  today: string;
  farm: {
    crop: string;
    cropKannada: string;
    acres: number;
    village: string;
    district: string;
    state: string;
    irrigation: string;
    plantedYear: number;
    stockQtl: Record<string, number>;
  };
  /** What the rules decided today, in priority order. */
  plan: { title: string; why: string; urgency: string; rupees?: number }[];
  weather: { date: string; rainMm: number; dryHours: number; humidityMaxPct: number }[];
  market: { market: string; grade: string; rupeesPerQuintal: number; date: string }[];
  money: {
    expectedYieldQtl: number;
    expectedRevenue: number | null;
    costsSoFar: number;
    expectedProfit: number | null;
    note?: string;
  };
  /** Facts about the crop the registry knows, so answers stay crop-correct. */
  cropFacts: {
    diseasesModelled: string[];
    notModelled?: string;
    yieldNote?: string;
  };
}

export function buildAskContext(farm: Farm, plan: FarmPlan): AskContext {
  const crop = getCrop(farm.cropId);
  const e = plan.economics;
  const valued = e.yieldKnown && e.priceKnown && e.bearing;

  return {
    today: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
    farm: {
      crop: crop.name.en,
      cropKannada: crop.name.kn,
      acres: farm.acres,
      village: farm.village,
      district: farm.district,
      state: farm.state,
      irrigation: farm.irrigation,
      plantedYear: farm.plantedYear,
      stockQtl: farm.stockQtl,
    },
    plan: plan.recommendations.map((r) => ({
      title: r.title,
      why: r.why,
      urgency: r.severity,
      ...(r.rupeeImpact ? { rupees: r.rupeeImpact } : {}),
    })),
    weather: plan.weather.days.map((d) => ({
      date: d.date,
      rainMm: Math.round(d.rainMm * 10) / 10,
      dryHours: d.dryHours,
      humidityMaxPct: Math.round(d.humidityMaxPct),
    })),
    // Only the best few quotes: the sell screen has the full board, and a long
    // price list crowds out the plan in the model's attention.
    market: (plan.market?.quotes ?? [])
      .slice()
      .sort((a, b) => b.modalPerQtl - a.modalPerQtl)
      .slice(0, 8)
      .map((q) => ({
        market: q.market,
        grade: q.grade,
        rupeesPerQuintal: q.modalPerQtl,
        date: q.date,
      })),
    money: {
      expectedYieldQtl: e.expectedYieldQtl,
      expectedRevenue: valued ? e.expectedRevenue : null,
      costsSoFar: e.totalCosts,
      expectedProfit: valued ? e.expectedProfit : null,
      ...(valued
        ? {}
        : {
            note: !e.bearing
              ? `Crop is not bearing yet; first harvest expected around ${e.firstHarvestOn ?? "unknown"}.`
              : !e.priceKnown
                ? "No mandi price available today, so the harvest cannot be valued."
                : "No harvest estimate exists for this crop.",
          }),
    },
    cropFacts: {
      diseasesModelled: crop.diseases.map((d) => d.name.en),
      notModelled: crop.notes,
      yieldNote: crop.yieldNote,
    },
  };
}
