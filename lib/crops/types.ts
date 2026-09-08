/**
 * A crop is data, not code.
 *
 * Everything the engine needs to advise on a crop lives in one CropConfig, so
 * adding a crop means adding an object — not touching the rules. Crops the
 * registry knows nothing about still work: they fall back to GENERIC_CROP,
 * which gives full market and irrigation advice and no disease rules, and the
 * UI says so rather than pretending.
 */

export type IrrigationMethod = "drip" | "sprinkler" | "flood" | "rainfed";

export interface GradeDef {
  /** Stable internal id. */
  id: string;
  label: { en: string; kn: string };
  /** Lowercased spellings seen in the Agmarknet variety column. */
  aliases: string[];
}

/**
 * A weather-driven disease window.
 *
 * Generalised from the arecanut koleroga rule: a pathogen needs a run of days
 * inside a humidity and temperature band during its season, and the treatment
 * needs a dry spell to be applied and then protects for a while.
 */
export interface DiseaseRule {
  id: string;
  name: { en: string; kn: string };
  /** Latin name, shown so an extension officer can check our work. */
  pathogen?: string;
  /** Months the infection window is open, 1-12. */
  months: number[];
  humidityPct: number;
  tempMinC: number;
  tempMaxC: number;
  /** Consecutive qualifying days before the risk is real. */
  wetDays: number;
  treatment: {
    name: { en: string; kn: string };
    /** Dry hours needed to apply it and let it set. */
    dryHours: number;
    /** How long one application protects for. */
    protectionDays: number;
  };
  /** Share of the crop typically lost if it takes hold — drives rupee impact. */
  lossShare: number;
}

/** Perennials yield nothing for years, then ramp. Seasonals are flat per cycle. */
export interface PerennialYield {
  kind: "perennial";
  /** Ascending breakpoints: from this age onward, expect this per acre. */
  curve: { fromAge: number; qtlPerAcre: number }[];
  /** Age after which yield tapers, and how fast per year. */
  declineFromAge?: number;
  declinePerYear?: number;
}

export interface SeasonalYield {
  kind: "seasonal";
  qtlPerAcre: number;
  /** Sowing to harvest, days. */
  cycleDays: number;
}

export interface CropConfig {
  id: string;
  name: { en: string; kn: string };
  /**
   * The commodity string Agmarknet publishes under. These are messy and vary;
   * the market route falls back to a loose match when the exact filter is empty.
   */
  agmarknetCommodity: string;
  /** Grades quoted for this crop. Empty means accept whatever the feed says. */
  grades: GradeDef[];
  irrigation: {
    /** Days between waterings by method. */
    intervalDays: Record<IrrigationMethod, number>;
    /** Rain over 48h above which irrigating is a waste. */
    rainSkipMm: number;
  };
  yield: PerennialYield | SeasonalYield;
  diseases: DiseaseRule[];
  /** Anything the farmer should be told about this crop that is not a rule. */
  notes?: string;
  /**
   * Where the yield figure came from and how much to trust it. Yields swing by
   * a factor of three across variety, season, soil and management, so this is
   * always an opening estimate the farmer is expected to correct.
   */
  yieldNote?: string;
}
