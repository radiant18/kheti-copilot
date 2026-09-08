import type { CropConfig, DiseaseRule } from "../crops";
import type { DayWeather, Farm, Recommendation, WeatherWindow } from "../types";

/**
 * Weather-driven agronomy, generalised across crops.
 *
 * Nothing here knows what crop it is looking at — it reads thresholds off the
 * CropConfig. Adding a crop means adding data to the registry, never editing
 * this file. The rules stay deterministic on purpose: an LLM may translate a
 * recommendation, but a hallucinated fungicide dose is a destroyed crop, so the
 * model never originates one.
 *
 * Thresholds in the registry follow published extension practice and are
 * pending review by an agronomist.
 */

function daysBetween(a: string, b: string): number {
  return Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function rainOver(days: DayWeather[], count: number): number {
  return days.slice(0, count).reduce((sum, d) => sum + d.rainMm, 0);
}

export function irrigationAdvice(
  farm: Farm,
  crop: CropConfig,
  wx: WeatherWindow,
  today = new Date(),
): Recommendation {
  const rain48 = rainOver(wx.days, 2);
  const { intervalDays, rainSkipMm } = crop.irrigation;

  if (farm.irrigation === "rainfed") {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "info",
      title: "Rainfed — nothing to irrigate",
      why: `${rain48.toFixed(0)} mm of rain expected over the next 2 days.`,
    };
  }

  if (rain48 >= rainSkipMm) {
    // Diesel and pump time saved is the concrete win the farmer feels.
    const saved = Math.round(farm.acres * 180);
    return {
      id: "irrigation",
      icon: "💧",
      severity: "act",
      title: "Do not irrigate today",
      why: `${rain48.toFixed(0)} mm of rain is expected in the next 48 hours — more than your ${crop.name.en.toLowerCase()} needs.`,
      rupeeImpact: saved,
      window: "Today",
    };
  }

  const interval = intervalDays[farm.irrigation];
  const since = farm.lastIrrigatedAt ? daysBetween(farm.lastIrrigatedAt, today.toISOString()) : interval;
  const due = interval - since;

  if (due <= 0) {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "act",
      title: "Irrigate today",
      why: `${since} days since your last irrigation and only ${rain48.toFixed(0)} mm of rain is expected. Your ${farm.irrigation} system is on a ${interval}-day cycle for ${crop.name.en.toLowerCase()}.`,
      window: "Today",
    };
  }

  const when = new Date(today.getTime() + due * 86_400_000);
  return {
    id: "irrigation",
    icon: "💧",
    severity: "info",
    title: `Next irrigation in ${due} day${due === 1 ? "" : "s"}`,
    why: `Last irrigated ${since} days ago on a ${interval}-day cycle.`,
    window: when.toLocaleDateString("en-IN", { weekday: "long" }),
  };
}

/**
 * The highest-value recommendation the app makes.
 *
 * A protective spray needs a dry spell to be applied and to set. Farmers
 * routinely lose sprays to rain returning two hours later. Public portals
 * publish rainfall; none of them say "Thursday, roughly nine dry hours."
 */
export function diseaseAdvice(
  farm: Farm,
  crop: CropConfig,
  rule: DiseaseRule,
  wx: WeatherWindow,
  pricePerQtl: number,
  expectedQtl: number,
  today = new Date(),
): Recommendation {
  const inSeason = rule.months.includes(today.getMonth() + 1);

  const wetDays = wx.days.filter(
    (d) =>
      d.rainMm > 2 &&
      d.humidityMaxPct >= rule.humidityPct &&
      d.tempMinC >= rule.tempMinC &&
      d.tempMaxC <= rule.tempMaxC,
  ).length;

  const lastSpray = farm.lastSprayAt?.[rule.id];
  const sinceSpray = lastSpray ? daysBetween(lastSpray, today.toISOString()) : Infinity;
  const protectionLeft = rule.treatment.protectionDays - sinceSpray;

  const sprayDay = wx.days.find((d) => d.dryHours >= rule.treatment.dryHours);
  const atRisk = inSeason && wetDays >= rule.wetDays;
  const atStake = Math.round(expectedQtl * pricePerQtl * rule.lossShare);

  if (atRisk && protectionLeft > 7) {
    return {
      id: rule.id,
      icon: "🌂",
      severity: "info",
      title: `${rule.name.en} conditions present — you are still protected`,
      why: `${wetDays} wet days ahead with humidity above ${rule.humidityPct}%, but your spray from ${sinceSpray} days ago has about ${protectionLeft} days of cover left.`,
    };
  }

  if (atRisk) {
    if (!sprayDay) {
      return {
        id: rule.id,
        icon: "🌂",
        severity: "urgent",
        title: `${rule.name.en} risk high — no dry window in the next 7 days`,
        why: `${wetDays} days of wet, humid weather ahead and ${Number.isFinite(sinceSpray) ? `your last spray was ${sinceSpray} days ago` : "no spray is recorded"}. There is no ${rule.treatment.dryHours}-hour dry gap in the forecast.`,
        rupeeImpact: -atStake,
      };
    }
    const day = new Date(sprayDay.date);
    const weekday = day.toLocaleDateString("en-IN", { weekday: "long" });
    return {
      id: rule.id,
      icon: "🌂",
      severity: "urgent",
      title: `Spray ${rule.treatment.name.en} on ${weekday}`,
      why: `${rule.name.en} weather is setting in (${wetDays} wet days, humidity above ${rule.humidityPct}%) and your protection has run out. ${weekday} has about ${sprayDay.dryHours} dry hours — the only workable window this week.`,
      rupeeImpact: -atStake,
      window: `${day.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, roughly ${sprayDay.dryHours} dry hours`,
    };
  }

  if (inSeason && protectionLeft <= 0) {
    return {
      id: rule.id,
      icon: "🌂",
      severity: "watch",
      title: `${rule.treatment.name.en} cover has expired`,
      why: Number.isFinite(sinceSpray)
        ? `Your last spray was ${sinceSpray} days ago; cover lasts about ${rule.treatment.protectionDays} days.`
        : `No protective spray recorded this season for ${rule.name.en.toLowerCase()}.`,
    };
  }

  return {
    id: rule.id,
    icon: "🌂",
    severity: "info",
    title: `${rule.name.en} risk low`,
    why: inSeason
      ? `Only ${wetDays} day(s) in the forecast meet the infection conditions.`
      : `Outside the ${rule.name.en.toLowerCase()} season.`,
  };
}

/** Crops with no curated rules say so, rather than pretending to advise. */
export function coverageNote(crop: CropConfig): Recommendation {
  return {
    id: "coverage",
    icon: "📋",
    severity: "info",
    title: `No disease rules for ${crop.name.en.toLowerCase()} yet`,
    why: "Market prices, irrigation timing and your cost book all work. Pest and disease advice needs this crop to be added to the registry — everything else on this screen is live.",
  };
}

export function agronomyPlan(
  farm: Farm,
  crop: CropConfig,
  wx: WeatherWindow,
  pricePerQtl: number,
  expectedQtl: number,
  today = new Date(),
): Recommendation[] {
  const out: Recommendation[] = [irrigationAdvice(farm, crop, wx, today)];

  for (const rule of crop.diseases) {
    out.push(diseaseAdvice(farm, crop, rule, wx, pricePerQtl, expectedQtl, today));
  }

  if (crop.diseases.length === 0) out.push(coverageNote(crop));

  if (crop.notes) {
    out.push({
      id: "crop-note",
      icon: "📸",
      severity: "watch",
      title: `${crop.name.en}: worth knowing`,
      why: crop.notes,
      window: "Weekly",
    });
  }

  return out;
}
