"use client";

import { useMemo } from "react";
import { localeFor, t, type Lang } from "@/lib/i18n";
import type { SprayWindow } from "@/lib/engine/pressure";
import type { WeatherWindow } from "@/lib/types";

/**
 * When it will rain, hour by hour.
 *
 * "3 mm" tells a farmer almost nothing — is that a shower or a washout? What
 * they need is *when*, because that is what decides whether the morning is
 * usable, whether a spray will survive, whether the drying yard should be
 * covered. A day total hides all of it: 3 mm at four in the morning and 3 mm across
 * the working afternoon are completely different days.
 *
 * So each day is a row of working hours, shaded by how hard it is raining, and
 * the recommended spray window is drawn on top. The pattern — "it rains every
 * afternoon" — is visible without reading a single number.
 *
 * The grid only works if a square's position reads as a time of day, so the
 * columns are labelled morning / afternoon / evening, the first row says Today
 * rather than a weekday, and each day ends in the same one word the legend
 * uses. Millimetres stay, but as the small print — the words carry the meaning.
 */

/** The working day. Nobody is spraying at 3am and the row would not fit. */
const FIRST_HOUR = 6;
const LAST_HOUR = 19;

/** Column headings, so nobody has to count squares to find the afternoon. */
const PARTS = [
  { key: "partMorning", hours: 6, align: "text-left" },
  { key: "partAfternoon", hours: 5, align: "text-center" },
  { key: "partEvening", hours: 3, align: "text-right" },
] as const;

/**
 * Four steps, spaced far enough apart to read at a glance on a cheap screen in
 * sunlight. A subtle ramp is useless here — the whole point is that the shape
 * of the day is obvious without squinting.
 */
function intensity(mm: number): string {
  if (mm < 0.1) return "var(--surface-2)";
  if (mm < 1) return "color-mix(in srgb, var(--rain) 30%, var(--surface-2))";
  if (mm < 4) return "color-mix(in srgb, var(--rain) 65%, var(--surface-2))";
  return "var(--rain)";
}

/** A whole day in one word — the same three words the legend explains. */
function dayWord(totalMm: number): "rainDry" | "rainLight" | "rainHeavy" {
  if (totalMm < 1) return "rainDry";
  if (totalMm < 10) return "rainLight";
  return "rainHeavy";
}

export function RainOutlook({
  wx,
  lang,
  spray,
}: {
  wx: WeatherWindow;
  lang: Lang;
  spray?: SprayWindow | null;
}) {
  const rows = useMemo(() => {
    const byDay = new Map<string, Map<number, number>>();
    wx.hourly.time.forEach((stamp, i) => {
      const day = stamp.slice(0, 10);
      const hour = Number(stamp.slice(11, 13));
      if (hour < FIRST_HOUR || hour > LAST_HOUR) return;
      if (!byDay.has(day)) byDay.set(day, new Map());
      byDay.get(day)!.set(hour, wx.hourly.rainMm[i] ?? 0);
    });

    return wx.days.slice(0, 5).map((d) => ({
      date: d.date,
      total: d.rainMm,
      hours: byDay.get(d.date) ?? new Map<number, number>(),
    }));
  }, [wx]);

  const hourList = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);

  /**
   * A count of rainy days and the worst one beats a five-day millimetre total,
   * which a farmer would have to divide in their head before it meant anything.
   */
  const wet = rows.filter((r) => r.total >= 1);
  const wettest = wet.length
    ? wet.reduce((worst, r) => (r.total > worst.total ? r : worst))
    : null;
  const summary = wettest
    ? t(lang, wet.length === rows.length ? "rainSummaryAll" : "rainSummarySome", {
        n: wet.length,
        days: rows.length,
        day:
          rows.indexOf(wettest) === 0
            ? t(lang, "navToday")
            : new Date(wettest.date).toLocaleDateString(localeFor(lang), { weekday: "long" }),
      })
    : t(lang, "rainSummaryNone", { days: rows.length });

  return (
    <section>
      <h2 className="eyebrow mb-1">{t(lang, "rainHeading")}</h2>
      <p className="mb-3 text-sm" style={{ color: "var(--ink-soft)" }}>
        {summary}
      </p>

      <div className="mb-1 flex items-center gap-2">
        <span className="w-12 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-[2px]">
          {PARTS.map((p) => (
            <span
              key={p.key}
              className={`${p.align} text-[10px] uppercase tracking-wide`}
              style={{ flex: p.hours, color: "var(--ink-faint)" }}
            >
              {t(lang, p.key)}
            </span>
          ))}
        </div>
        <span className="w-12 shrink-0" />
      </div>

      <div className="space-y-1.5">
        {rows.map((row, rowIndex) => {
          const day = new Date(row.date);
          const isSprayDay = spray?.date === row.date;
          const word = dayWord(row.total);

          return (
            <div key={row.date} className="flex items-center gap-2">
              <span
                className="w-12 shrink-0 text-[11px] font-bold uppercase"
                style={{ color: rowIndex === 0 ? "var(--accent)" : "var(--ink-faint)" }}
              >
                {rowIndex === 0
                  ? t(lang, "navToday")
                  : day.toLocaleDateString(localeFor(lang), { weekday: "short" })}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <div className="flex gap-[2px]">
                  {hourList.map((h) => {
                    const mm = row.hours.get(h) ?? 0;
                    return (
                      <span
                        key={h}
                        title={`${h}:00 — ${mm.toFixed(1)} mm`}
                        className="h-5 flex-1 rounded-[3px]"
                        style={{ background: intensity(mm) }}
                      />
                    );
                  })}
                </div>

                {/* The recommended window, drawn under the hours it covers. */}
                <div className="flex gap-[2px]" aria-hidden>
                  {hourList.map((h) => {
                    const inWindow =
                      isSprayDay && spray && h >= spray.fromHour && h < spray.toHour;
                    return (
                      <span
                        key={h}
                        className="h-[3px] flex-1 rounded-full"
                        style={{ background: inWindow ? "var(--accent)" : "transparent" }}
                      />
                    );
                  })}
                </div>
              </div>

              <span className="w-12 shrink-0 text-right leading-tight">
                <span
                  className="block text-[11px] font-semibold"
                  style={{ color: word === "rainHeavy" ? "var(--rain)" : "var(--ink-soft)" }}
                >
                  {t(lang, word)}
                </span>
                {/* Zero millimetres beside the word "dry" is a number that
                    earns nothing, so a dry day just says dry. */}
                {row.total >= 1 && (
                  <span className="tabular block text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    {row.total.toFixed(0)}mm
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]" style={{ color: "var(--ink-faint)" }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-[2px]" style={{ background: "var(--surface-2)" }} />
          {t(lang, "rainDry")}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-4 rounded-[2px]"
            style={{ background: "color-mix(in srgb, var(--rain) 30%, var(--surface-2))" }}
          />
          {t(lang, "rainLight")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-[2px]" style={{ background: "var(--rain)" }} />
          {t(lang, "rainHeavy")}
        </span>
        {spray && (
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-4 rounded-full" style={{ background: "var(--accent)" }} />
            {t(lang, "sprayWindowLegend")}
          </span>
        )}
      </div>
    </section>
  );
}
