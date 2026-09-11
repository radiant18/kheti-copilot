"use client";

import { useMemo } from "react";
import { localeFor, t, type Lang } from "@/lib/i18n";
import type { SprayWindow } from "@/lib/engine/pressure";
import type { WeatherWindow } from "@/lib/types";

/**
 * When it will rain, in sentences.
 *
 * This replaced an hour-by-hour heat grid. The grid was more precise and it was
 * the wrong tool: it needed a four-item colour legend, and reading "rain on
 * Saturday afternoon" off it meant counting squares against column headings.
 * A farmer glancing at their phone before walking out will not do that, and a
 * chart nobody reads is worth less than a sentence they do.
 *
 * So each day gets one line in plain words — how much, and roughly when. The
 * millimetres stay as small print for anyone who wants them, and the day with
 * the spray window is called out, since that is the one a decision hangs on.
 */

const MORNING: [number, number] = [6, 12];
const AFTERNOON: [number, number] = [12, 17];
const EVENING: [number, number] = [17, 21];

interface DayLine {
  date: string;
  label: string;
  mm: number;
  sentence: string;
  icon: string;
  spray: boolean;
}

function sum(hours: number[], rain: number[], from: number, to: number, hourOf: (i: number) => number) {
  return hours.reduce((acc, i) => (hourOf(i) >= from && hourOf(i) < to ? acc + (rain[i] ?? 0) : acc), 0);
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
  const lines = useMemo<DayLine[]>(() => {
    const h = wx.hourly;
    if (!h?.time?.length) return [];

    const byDay = new Map<string, number[]>();
    h.time.forEach((stamp, i) => {
      const day = stamp.slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(i);
    });

    const todayIso = new Date().toISOString().slice(0, 10);
    const hourOf = (i: number) => Number(h.time[i].slice(11, 13));

    return [...byDay.entries()]
      .filter(([day]) => day >= todayIso)
      .slice(0, 5)
      .map(([day, hours]) => {
        const mm = hours.reduce((acc, i) => acc + (h.rainMm[i] ?? 0), 0);
        const parts: string[] = [];
        if (sum(hours, h.rainMm, ...MORNING, hourOf) >= 0.5) parts.push(t(lang, "whenMorning"));
        if (sum(hours, h.rainMm, ...AFTERNOON, hourOf) >= 0.5) parts.push(t(lang, "whenAfternoon"));
        if (sum(hours, h.rainMm, ...EVENING, hourOf) >= 0.5) parts.push(t(lang, "whenEvening"));

        const strength =
          mm < 1 ? "rainNone" : mm < 5 ? "rainSoftLight" : mm < 20 ? "rainMod" : "rainSoftHeavy";
        const when = parts.length >= 3 ? t(lang, "partAllDay") : parts.join(", ");

        return {
          date: day,
          label:
            day === todayIso
              ? t(lang, "rainToday")
              : new Date(`${day}T12:00`).toLocaleDateString(localeFor(lang), { weekday: "long" }),
          mm: Math.round(mm * 10) / 10,
          sentence: mm < 1 ? t(lang, "rainNone") : `${t(lang, strength)}${when ? ` ${when}` : ""}`,
          icon: mm < 1 ? "☀️" : mm < 5 ? "🌤️" : mm < 20 ? "🌦️" : "🌧️",
          spray: spray ? spray.date.slice(0, 10) === day : false,
        };
      });
  }, [wx, lang, spray]);

  if (lines.length === 0) return null;

  return (
    <section>
      <h2 className="eyebrow mb-2">{t(lang, "rainSimpleHeading")}</h2>
      <ul className="card divide-y overflow-hidden" style={{ borderColor: "var(--line)" }}>
        {lines.map((d) => (
          <li
            key={d.date}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderColor: "var(--line)" }}
          >
            <span aria-hidden className="text-[20px] leading-none">{d.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold capitalize">{d.label}</span>
              <span className="block text-[13px]" style={{ color: "var(--ink-soft)" }}>
                {d.sentence}
                {d.spray && (
                  <span className="ml-1 font-semibold" style={{ color: "var(--accent)" }}>
                    · {t(lang, "raySprayOk")}
                  </span>
                )}
              </span>
            </span>
            {d.mm >= 1 && (
              <span className="tabular text-[13px] font-semibold" style={{ color: "var(--ink-faint)" }}>
                {d.mm} mm
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
