// Domain types for the farm copilot.
// Everything the engine reasons about is defined here so the rules stay pure
// and testable — no fetching, no React, no I/O.

export type Lang = "kn" | "en";

/**
 * A grade id, scoped to a crop. Curated crops declare theirs in the registry
 * (arecanut has "rashi", "chippu"…); crops nobody has curated take whatever
 * variety string the Agmarknet feed carries, slugified.
 */
export type Grade = string;

export type IrrigationMethod = "drip" | "sprinkler" | "flood" | "rainfed";

export interface Farm {
  id: string;
  ownerName: string;
  /** Crop id from the registry — decides which rules run. */
  cropId: string;
  lat: number;
  lon: number;
  village: string;
  district: string;
  /** State, used to scope the mandi price query. */
  state: string;
  acres: number;
  /** Year planted for perennials; year of sowing for seasonals. */
  plantedYear: number;
  irrigation: IrrigationMethod;
  soil: "laterite" | "alluvial" | "red_loam" | "black" | "sandy";
  lang: Lang;
  lastIrrigatedAt?: string;
  /** Last protective spray, per disease id. */
  lastSprayAt?: Record<string, string>;
  /** Unsold stock on hand, by grade, in quintals. */
  stockQtl: Record<Grade, number>;
}

export interface DayWeather {
  date: string;
  rainMm: number;
  tempMaxC: number;
  tempMinC: number;
  humidityMaxPct: number;
  /** Daylight hours with no rain and humidity low enough to spray. */
  dryHours: number;
}

export interface WeatherWindow {
  updatedAt: string;
  days: DayWeather[];
  past7dRainMm: number;
}

export interface MandiQuote {
  market: string;
  district: string;
  grade: Grade;
  modalPerQtl: number;
  minPerQtl: number;
  maxPerQtl: number;
  date: string;
  distanceKm?: number;
}

export interface MarketView {
  updatedAt: string;
  quotes: MandiQuote[];
  stateModal: Record<Grade, number>;
  weekChangePct: Record<Grade, number>;
  /** True when these are bundled fallback quotes, not a live Agmarknet pull. */
  sample?: boolean;
  /** Which crop these quotes are for. */
  cropId?: string;
}

export type Severity = "info" | "watch" | "act" | "urgent";

/**
 * One concrete thing the farmer should do (or deliberately not do) today.
 * `why` is the deterministic reason string; the translation layer may render it
 * in Kannada, but it may never invent an action the rules did not produce.
 */
export interface Recommendation {
  id: string;
  icon: string;
  severity: Severity;
  title: string;
  why: string;
  rupeeImpact?: number;
  window?: string;
}

export interface Economics {
  expectedYieldQtl: number;
  expectedRevenue: number;
  totalCosts: number;
  expectedProfit: number;
  weekDeltaRupees: number;
  /** False when the registry has no yield model for this crop. */
  yieldKnown: boolean;
  /** False when no mandi price was available to value the harvest at. */
  priceKnown: boolean;
}

export interface CostEntry {
  id: string;
  farmId: string;
  date: string;
  category: "seed" | "fertilizer" | "labour" | "pesticide" | "irrigation" | "transport" | "other";
  amount: number;
  note?: string;
}

export interface FarmPlan {
  generatedAt: string;
  farmId: string;
  recommendations: Recommendation[];
  weather: WeatherWindow;
  market: MarketView | null;
  economics: Economics;
}
