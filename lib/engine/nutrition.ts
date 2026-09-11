import type { CropConfig } from "../crops";
import type { Farm } from "../types";

/**
 * Fertiliser timing — a reminder, not a prescription.
 *
 * This tells a farmer when they last put fertiliser out and roughly when the
 * next round falls due. It deliberately says nothing about *what* to apply or
 * how much: doses depend on soil test, variety, age and season, and the whole
 * app's rule is that it never invents one. Missing a round costs yield; guessing
 * a dose costs money and can burn the crop.
 *
 * Intervals below are the common split schedules — perennials fed two to three
 * times a year, short vegetables topped up every few weeks. Like everything
 * agronomic here they are pending review, and the farmer's own schedule should
 * win once they have recorded a couple of rounds.
 */

/** Days between rounds, by crop. Anything unlisted falls back by crop kind. */
const INTERVAL: Record<string, number> = {
  arecanut: 120,
  coconut: 120,
  copra: 120,
  black_pepper: 120,
  cocoa: 120,
  cardamom: 120,
  coffee: 120,
  rubber: 150,
  mango: 150,
  cashew: 150,
  grapes: 45,
  pomegranate: 60,
  banana: 60,
  sugarcane: 45,
  paddy: 25,
  wheat: 30,
  maize: 30,
  tomato: 21,
  onion: 25,
  potato: 25,
  brinjal: 25,
};

export function fertiliserIntervalDays(crop: CropConfig): number {
  return INTERVAL[crop.id] ?? (crop.yield.kind === "perennial" ? 120 : 30);
}

export interface FertiliserStatus {
  /** Null when the farmer has never recorded a round. */
  lastAt: string | null;
  daysSince: number | null;
  intervalDays: number;
  /** Negative means overdue by that many days. */
  daysUntilNext: number | null;
  dueOn: string | null;
  state: "unknown" | "due" | "overdue" | "ok";
}

export function fertiliserStatus(
  farm: Farm,
  crop: CropConfig,
  today = new Date(),
): FertiliserStatus {
  const intervalDays = fertiliserIntervalDays(crop);
  const last = farm.lastFertilisedAt;

  if (!last) {
    return {
      lastAt: null,
      daysSince: null,
      intervalDays,
      daysUntilNext: null,
      dueOn: null,
      state: "unknown",
    };
  }

  const daysSince = Math.floor((today.getTime() - Date.parse(last)) / 86_400_000);
  const daysUntilNext = intervalDays - daysSince;
  const dueOn = new Date(Date.parse(last) + intervalDays * 86_400_000).toISOString();

  return {
    lastAt: last,
    daysSince,
    intervalDays,
    daysUntilNext,
    dueOn,
    // A week either side of the date is "due"; a schedule this coarse cannot
    // justify telling somebody they are late by two days.
    state: daysUntilNext < -7 ? "overdue" : daysUntilNext <= 7 ? "due" : "ok",
  };
}
