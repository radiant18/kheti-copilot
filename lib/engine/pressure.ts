import type { DiseaseRule } from "../crops";
import type { WeatherWindow } from "../types";

/**
 * Disease pressure, counted in hours.
 *
 * A fungal infection does not happen because it rained. It happens because the
 * canopy stayed wet, inside a temperature band, for long enough — and by the
 * time symptoms are visible the decision to spray is already a week late.
 *
 * Counting those hours needs the hourly series and the pathogen's thresholds.
 * A farmer standing in the garden cannot do it, and neither can a daily
 * forecast. This is the number worth waking up to.
 *
 * Thresholds come from the crop registry and are pending agronomist review, as
 * is everything else in the rules.
 */

export interface Pressure {
  /** Qualifying hours already banked, over the past week. */
  hoursSoFar: number;
  /** Qualifying hours coming in the next three days. */
  hoursAhead: number;
  /** Hours at which infection becomes likely for this pathogen. */
  threshold: number;
  /** How far along, 0–1+, for a bar. */
  fraction: number;
  /** The longest unbroken wet run, which is what actually triggers infection. */
  longestRunHours: number;
}

/** Rough leaf-wetness proxy: raining, or humid enough that the canopy stays wet. */
function isWetHour(rule: DiseaseRule, rainMm: number, humidity: number, tempC: number): boolean {
  const wet = rainMm > 0.1 || humidity >= rule.humidityPct;
  return wet && tempC >= rule.tempMinC && tempC <= rule.tempMaxC;
}

export function diseasePressure(rule: DiseaseRule, wx: WeatherWindow, now = new Date()): Pressure | null {
  const h = wx.hourly;
  if (!h?.time?.length) return null;

  // Infection hours accumulate over roughly the pathogen's wet-period window.
  const threshold = rule.wetDays * 12;
  const nowIso = now.toISOString().slice(0, 13);

  let hoursSoFar = 0;
  let hoursAhead = 0;
  let run = 0;
  let longestRun = 0;

  h.time.forEach((stamp, i) => {
    const wet = isWetHour(rule, h.rainMm[i] ?? 0, h.humidity[i] ?? 0, h.tempC[i] ?? 0);
    if (wet) {
      run += 1;
      longestRun = Math.max(longestRun, run);
    } else {
      run = 0;
    }
    if (!wet) return;
    if (stamp.slice(0, 13) <= nowIso) hoursSoFar += 1;
    else hoursAhead += 1;
  });

  return {
    hoursSoFar,
    hoursAhead,
    threshold,
    fraction: threshold > 0 ? hoursSoFar / threshold : 0,
    longestRunHours: longestRun,
  };
}

export interface SprayWindow {
  date: string;
  /** Clock hours, 24h. */
  fromHour: number;
  toHour: number;
  hours: number;
  /** Hour rain returns after the window, if it does that same day. */
  rainReturnsHour?: number;
}

/**
 * The next stretch of daylight long enough to spray and let it dry.
 *
 * Naming a day is not enough — a grower who sprays at three o'clock and gets
 * rain at five has wasted the chemical and the labour. So this returns the
 * clock hours, and when rain arrives later the same day it says when.
 */
export function nextSprayWindow(
  wx: WeatherWindow,
  hoursNeeded: number,
  maxHumidity = 85,
  now = new Date(),
): SprayWindow | null {
  const h = wx.hourly;
  if (!h?.time?.length) return null;

  const nowIso = now.toISOString().slice(0, 13);
  const byDay = new Map<string, number[]>();
  h.time.forEach((stamp, i) => {
    if (stamp.slice(0, 13) < nowIso) return;
    const day = stamp.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(i);
  });

  for (const [date, indices] of [...byDay.entries()].sort()) {
    let start: number | null = null;
    let best: { from: number; to: number } | null = null;

    for (const i of indices) {
      const hour = Number(h.time[i].slice(11, 13));
      const usable =
        hour >= 8 &&
        hour <= 17 &&
        (h.rainMm[i] ?? 0) < 0.2 &&
        (h.humidity[i] ?? 100) < maxHumidity;

      if (usable) {
        if (start === null) start = hour;
        if (!best || hour - start + 1 > best.to - best.from + 1) best = { from: start, to: hour };
      } else {
        start = null;
      }
    }

    if (best && best.to - best.from + 1 >= hoursNeeded) {
      const rainAfter = indices.find(
        (i) => Number(h.time[i].slice(11, 13)) > best!.to && (h.rainMm[i] ?? 0) >= 0.5,
      );
      return {
        date,
        fromHour: best.from,
        toHour: best.to + 1,
        hours: best.to - best.from + 1,
        ...(rainAfter !== undefined
          ? { rainReturnsHour: Number(h.time[rainAfter].slice(11, 13)) }
          : {}),
      };
    }
  }
  return null;
}
