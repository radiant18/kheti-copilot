import type { WeatherWindow } from "../types";

/**
 * What it is doing outside right now, and what the rest of today holds.
 *
 * The forecast screens answer "what about this week". Standing in the garden at
 * seven in the morning, the question is smaller and more immediate: is it going
 * to rain on me in the next few hours. This reads the hourly series either side
 * of now to answer that and nothing else.
 */

export interface Conditions {
  tempC: number;
  humidityPct: number;
  rainingNow: boolean;
  /** Rain still to come before midnight, mm. */
  rainRestOfDayMm: number;
  /** The next hour with meaningful rain, if any, as a local hour 0-23. */
  rainStartsHour: number | null;
  /** Hours left today with no rain. */
  dryHoursLeft: number;
  /** Highest temperature still to come today. */
  peakTempC: number;
}

export function currentConditions(wx: WeatherWindow, now = new Date()): Conditions | null {
  const h = wx.hourly;
  if (!h?.time?.length) return null;

  // Open-Meteo returns local time already, so compare on the wall clock rather
  // than converting — the farmer's "now" is the phone's now.
  const stamp = `${now.toISOString().slice(0, 10)}T${String(now.getHours()).padStart(2, "0")}:00`;
  let i = h.time.indexOf(stamp);
  if (i === -1) {
    // Nearest earlier hour, so a gap in the series still yields something.
    i = h.time.findIndex((t) => t > stamp) - 1;
    if (i < 0) return null;
  }

  const today = stamp.slice(0, 10);
  const rest: number[] = [];
  for (let j = i; j < h.time.length && h.time[j].slice(0, 10) === today; j++) rest.push(j);

  const rainRestOfDayMm = rest.reduce((sum, j) => sum + (h.rainMm[j] ?? 0), 0);
  const firstWet = rest.find((j) => (h.rainMm[j] ?? 0) >= 0.5);

  return {
    tempC: Math.round(h.tempC[i] ?? 0),
    humidityPct: Math.round(h.humidity[i] ?? 0),
    rainingNow: (h.rainMm[i] ?? 0) >= 0.2,
    rainRestOfDayMm: Math.round(rainRestOfDayMm * 10) / 10,
    rainStartsHour: firstWet === undefined ? null : Number(h.time[firstWet].slice(11, 13)),
    dryHoursLeft: rest.filter((j) => (h.rainMm[j] ?? 0) < 0.2).length,
    peakTempC: Math.round(Math.max(...rest.map((j) => h.tempC[j] ?? 0))),
  };
}
