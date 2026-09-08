// Domain types for the arecanut farm copilot.
// Everything the engine reasons about is defined here so the rules stay pure
// and testable — no fetching, no React, no I/O.

export type Lang = "kn" | "en";

/** Arecanut grades actually quoted at Karnataka APMCs (see Agmarknet varieties). */
export type ArecaGrade =
  | "rashi"
  | "hosa_chali"
  | "hale_chali"
  | "chippu"
  | "bilegotu"
  | "cqca";

export interface Farm {
  id: string;
  ownerName: string;
  lat: number;
  lon: number;
  village: string;
  district: string;
  /** Area under arecanut, in acres. */
  acres: number;
  /** Year the garden was planted — drives yield expectations. */
  plantedYear: number;
  /** Grades this garden typically produces, best-first. */
  grades: ArecaGrade[];
  irrigation: "drip" | "sprinkler" | "flood" | "rainfed";
  soil: "laterite" | "alluvial" | "red_loam";
  lang: Lang;
  /** Last time the farmer told us they irrigated (ISO date). */
  lastIrrigatedAt?: string;
  /** Last prophylactic Bordeaux spray (ISO date). */
  lastSprayAt?: string;
  /** Unsold stock on hand, by grade, in quintals. */
  stockQtl: Partial<Record<ArecaGrade, number>>;
}

export interface DayWeather {
  date: string;
  rainMm: number;
  tempMaxC: number;
  tempMinC: number;
  humidityMaxPct: number;
  /** Hours in the day with no rain and humidity under the spray threshold. */
  dryHours: number;
}

export interface WeatherWindow {
  updatedAt: string;
  days: DayWeather[];
  /** Rolling rain over the previous 7 days, from the archive endpoint. */
  past7dRainMm: number;
}

export interface MandiQuote {
  market: string;
  district: string;
  grade: ArecaGrade;
  /** Modal price in rupees per quintal. */
  modalPerQtl: number;
  minPerQtl: number;
  maxPerQtl: number;
  date: string;
  /** Straight-line distance from the farm, km. */
  distanceKm?: number;
}

export interface MarketView {
  updatedAt: string;
  quotes: MandiQuote[];
  /** Modal price per grade averaged across the state, for trend context. */
  stateModal: Partial<Record<ArecaGrade, number>>;
  /** Percent change in state modal vs 7 days ago, per grade. */
  weekChangePct: Partial<Record<ArecaGrade, number>>;
  /** True when these are bundled fallback quotes, not a live Agmarknet pull. */
  sample?: boolean;
}

export type Severity = "info" | "watch" | "act" | "urgent";

/**
 * One concrete thing the farmer should do (or deliberately not do) today.
 * `why` is the deterministic reason string; the LLM layer may rewrite it into
 * Kannada, but it may never invent an action that the rules did not produce.
 */
export interface Recommendation {
  id: string;
  icon: string;
  severity: Severity;
  /** Short imperative headline, e.g. "Do not irrigate today". */
  title: string;
  /** The evidence, in plain numbers. */
  why: string;
  /** Optional money impact in rupees, signed. */
  rupeeImpact?: number;
  /** Deadline or window for the action. */
  window?: string;
}

export interface FarmPlan {
  generatedAt: string;
  farmId: string;
  recommendations: Recommendation[];
  weather: WeatherWindow;
  market: MarketView | null;
  economics: Economics;
}

export interface Economics {
  expectedYieldQtl: number;
  /** Realisable value of standing crop + stock at today's best price. */
  expectedRevenue: number;
  totalCosts: number;
  expectedProfit: number;
  /** Change in expected profit vs the snapshot 7 days ago. */
  weekDeltaRupees: number;
}

export interface CostEntry {
  id: string;
  farmId: string;
  date: string;
  category: "seed" | "fertilizer" | "labour" | "pesticide" | "irrigation" | "transport" | "other";
  amount: number;
  note?: string;
}
