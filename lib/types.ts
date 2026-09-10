// Domain types for the farm copilot.
// Everything the engine reasons about is defined here so the rules stay pure
// and testable — no fetching, no React, no I/O.

import type { Lang } from "./i18n";

export type { Lang };

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
  /**
   * What the farmer actually counted, for crops that are counted rather than
   * measured. `acres` stays the engine's unit and is derived from this; keeping
   * the original means the app can show back the number they gave us instead of
   * a converted figure they would not recognise.
   */
  plantCount?: number;
  /**
   * The unit the farmer answered in — guntas, cents, acres, or plants. Stored
   * so the app can show the size back in the words they used rather than a
   * conversion they would not recognise.
   */
  sizeUnit?: string;
  /** Year planted. Coarse, but enough for a perennial's age in years. */
  plantedYear: number;
  /**
   * The farmer's own expected yield in quintals per acre, overriding the
   * registry estimate. Registry figures are national ballparks; the grower
   * knows what their block actually gives. Undefined means use the estimate.
   */
  /**
   * Exact planting/sowing date, ISO. Required to be useful for seasonal crops:
   * a banana sucker takes ~11 months to its first bunch, so a year alone cannot
   * tell us whether this farm has a harvest coming or one already in hand.
   */
  plantedOn?: string;
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
  /**
   * FAO-56 reference evapotranspiration: how much water a standard grass
   * surface lost that day. Multiplied by the crop coefficient this becomes what
   * the garden actually drank, which is the number no farmer can see.
   */
  et0Mm: number;
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
  /** Today onward. */
  days: DayWeather[];
  /** The last seven days, for the water balance and disease pressure counts. */
  past: DayWeather[];
  /**
   * Hour-by-hour, past week through the coming week. Kept as parallel arrays
   * rather than objects because this is the largest thing the app downloads and
   * the farmer is often on a village connection.
   */
  hourly: {
    time: string[];
    rainMm: number[];
    humidity: number[];
    tempC: number[];
  };
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
  /**
   * Where this board came from.
   *  live         - a real Agmarknet pull
   *  sample       - bundled fallback quotes, feed unreachable or returned nothing
   *  unconfigured - no DATA_GOV_API_KEY, so the feed was never called
   *
   * The last one matters: reporting "no quotes today" when we never asked blames
   * the mandi for our own missing key, and the farmer would wait for prices that
   * are never coming.
   */
  source: "live" | "sample" | "unconfigured";
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
  /** False while the crop is too young to yield anything. */
  bearing: boolean;
  /** When the first harvest is expected, ISO date or year. Null if unknown. */
  firstHarvestOn: string | null;
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
