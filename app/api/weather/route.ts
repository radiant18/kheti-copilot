import { NextResponse } from "next/server";
import type { DayWeather, WeatherWindow } from "@/lib/types";

/**
 * Weather, shaped for the questions the app actually asks.
 *
 * Three things beyond a normal forecast, and each exists because a farmer
 * cannot work it out standing in the garden:
 *
 *  - et0_fao_evapotranspiration, the FAO-56 reference figure for how much water
 *    the day took out of the ground. Times the crop coefficient this becomes
 *    what the garden drank, which is the basis of a real irrigation answer
 *    rather than "it has been seven days".
 *  - seven days of history alongside the forecast, because a water balance and
 *    a disease-pressure count are both about what has already happened.
 *  - the raw hourly series, so the engine can count infection hours inside a
 *    pathogen's humidity and temperature band and name an actual clock window
 *    for spraying.
 *
 * Open-Meteo's free tier is non-commercial; a paid plan or an IMD licence is
 * needed before this ships to real users.
 */

const FORECAST = "https://api.open-meteo.com/v1/forecast";

/** Humidity above this and a spray will not dry properly on the bunch. */
const SPRAY_MAX_HUMIDITY = 85;

interface OpenMeteo {
  hourly: {
    time: string[];
    precipitation: number[];
    relative_humidity_2m: number[];
    temperature_2m: number[];
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    relative_humidity_2m_max: number[];
    et0_fao_evapotranspiration: number[];
  };
}

/** Daylight hours with no rain and humidity low enough for a spray to set. */
function dryHoursByDay(h: OpenMeteo["hourly"]): Map<string, number> {
  const counts = new Map<string, number>();
  h.time.forEach((stamp, i) => {
    const day = stamp.slice(0, 10);
    const hour = Number(stamp.slice(11, 13));
    const usable =
      hour >= 8 &&
      hour <= 17 &&
      (h.precipitation[i] ?? 0) < 0.2 &&
      (h.relative_humidity_2m[i] ?? 100) < SPRAY_MAX_HUMIDITY;
    counts.set(day, (counts.get(day) ?? 0) + (usable ? 1 : 0));
  });
  return counts;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") ?? "12.87";
  const lon = searchParams.get("lon") ?? "74.88";

  const url =
    `${FORECAST}?latitude=${lat}&longitude=${lon}` +
    "&hourly=precipitation,relative_humidity_2m,temperature_2m" +
    "&daily=precipitation_sum,temperature_2m_max,temperature_2m_min" +
    ",relative_humidity_2m_max,et0_fao_evapotranspiration" +
    "&past_days=7&forecast_days=7&timezone=Asia%2FKolkata";

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`forecast ${res.status}`);
    const f = (await res.json()) as OpenMeteo;

    const dry = dryHoursByDay(f.hourly);
    // Must be the date in India, not UTC. toISOString() rolls over at 05:30
    // IST, so after that the split put yesterday at the head of the forecast.
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

    const all: DayWeather[] = f.daily.time.map((date, i) => ({
      date,
      rainMm: f.daily.precipitation_sum[i] ?? 0,
      tempMaxC: f.daily.temperature_2m_max[i] ?? 0,
      tempMinC: f.daily.temperature_2m_min[i] ?? 0,
      humidityMaxPct: f.daily.relative_humidity_2m_max[i] ?? 0,
      et0Mm: f.daily.et0_fao_evapotranspiration[i] ?? 0,
      dryHours: dry.get(date) ?? 0,
    }));

    const past = all.filter((d) => d.date < today);
    const days = all.filter((d) => d.date >= today);

    const window: WeatherWindow = {
      updatedAt: new Date().toISOString(),
      days,
      past,
      hourly: {
        time: f.hourly.time,
        rainMm: f.hourly.precipitation,
        humidity: f.hourly.relative_humidity_2m,
        tempC: f.hourly.temperature_2m,
      },
      past7dRainMm: Math.round(past.reduce((s, d) => s + d.rainMm, 0) * 10) / 10,
    };
    return NextResponse.json(window);
  } catch (err) {
    return NextResponse.json({ error: "weather_unavailable", detail: String(err) }, { status: 502 });
  }
}
