import { NextResponse } from "next/server";
import type { DayWeather, WeatherWindow } from "@/lib/types";

/**
 * Open-Meteo proxy.
 *
 * Two reasons this is a server route rather than a direct browser call:
 * the raw hourly payload is large and we only need the derived daily summary,
 * and it keeps a single place to swap in the IMD feed later without touching
 * the client. Note Open-Meteo's free tier is non-commercial — a paid plan or an
 * IMD licence is required before this ships to real users.
 */

const FORECAST = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

/** Humidity above this and a spray will not dry properly on the bunch. */
const SPRAY_MAX_HUMIDITY = 85;

interface OpenMeteoResponse {
  hourly: { time: string[]; precipitation: number[]; relative_humidity_2m: number[] };
  daily: {
    time: string[];
    precipitation_sum: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    relative_humidity_2m_max: number[];
  };
}

/**
 * Count usable spray hours per day: daylight, no rain, humidity low enough for
 * Bordeaux mixture to dry. This derived number is what makes the koleroga
 * recommendation actionable instead of merely informative.
 */
function dryHoursByDay(hourly: OpenMeteoResponse["hourly"]): Map<string, number> {
  const counts = new Map<string, number>();
  hourly.time.forEach((stamp, i) => {
    const day = stamp.slice(0, 10);
    const hour = Number(stamp.slice(11, 13));
    const usable =
      hour >= 8 &&
      hour <= 17 &&
      (hourly.precipitation[i] ?? 0) < 0.2 &&
      (hourly.relative_humidity_2m[i] ?? 100) < SPRAY_MAX_HUMIDITY;
    counts.set(day, (counts.get(day) ?? 0) + (usable ? 1 : 0));
  });
  return counts;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") ?? "12.87";
  const lon = searchParams.get("lon") ?? "74.88";

  const forecastUrl =
    `${FORECAST}?latitude=${lat}&longitude=${lon}` +
    "&hourly=precipitation,relative_humidity_2m" +
    "&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max" +
    "&timezone=Asia%2FKolkata&forecast_days=7";

  const end = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const start = new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10);
  const archiveUrl =
    `${ARCHIVE}?latitude=${lat}&longitude=${lon}` +
    `&start_date=${start}&end_date=${end}&daily=precipitation_sum&timezone=Asia%2FKolkata`;

  try {
    const [fRes, aRes] = await Promise.all([
      fetch(forecastUrl, { next: { revalidate: 1800 } }),
      fetch(archiveUrl, { next: { revalidate: 21_600 } }),
    ]);
    if (!fRes.ok) throw new Error(`forecast ${fRes.status}`);

    const f = (await fRes.json()) as OpenMeteoResponse;
    const dry = dryHoursByDay(f.hourly);

    const days: DayWeather[] = f.daily.time.map((date, i) => ({
      date,
      rainMm: f.daily.precipitation_sum[i] ?? 0,
      tempMaxC: f.daily.temperature_2m_max[i] ?? 0,
      tempMinC: f.daily.temperature_2m_min[i] ?? 0,
      humidityMaxPct: f.daily.relative_humidity_2m_max[i] ?? 0,
      dryHours: dry.get(date) ?? 0,
    }));

    let past7dRainMm = 0;
    if (aRes.ok) {
      const a = (await aRes.json()) as { daily: { precipitation_sum: number[] } };
      past7dRainMm = (a.daily.precipitation_sum ?? []).reduce((s, v) => s + (v ?? 0), 0);
    }

    const window: WeatherWindow = {
      updatedAt: new Date().toISOString(),
      days,
      past7dRainMm: Math.round(past7dRainMm * 10) / 10,
    };
    return NextResponse.json(window);
  } catch (err) {
    return NextResponse.json(
      { error: "weather_unavailable", detail: String(err) },
      { status: 502 },
    );
  }
}
