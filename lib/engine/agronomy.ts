import type { DayWeather, Farm, Recommendation, WeatherWindow } from "../types";

/**
 * Agronomic rules for arecanut in coastal Karnataka.
 *
 * These are deliberately deterministic. The LLM layer never decides anything —
 * it only translates and explains what these functions returned. That is the
 * difference between an advisory the farmer can trust with a Bordeaux spray
 * schedule and a chatbot that hallucinates a fungicide dose.
 *
 * Thresholds follow ICAR-CPCRI / Directorate of Arecanut & Spices practice for
 * the Dakshina Kannada / Uttara Kannada belt and should be reviewed with an
 * agronomist before any real farmer sees them.
 */

/** Rain in the next 48h above this makes irrigation a waste of diesel. */
const RAIN_SKIP_IRRIGATION_MM = 10;

/** Days between irrigations, by delivery method, in the dry season. */
const IRRIGATION_INTERVAL_DAYS: Record<Farm["irrigation"], number> = {
  drip: 3,
  sprinkler: 6,
  flood: 8,
  rainfed: Number.POSITIVE_INFINITY,
};

/** Koleroga (Phytophthora meadii) needs a wet, warm, humid stretch to take hold. */
const KOLEROGA = {
  humidityPct: 90,
  tempMinC: 20,
  tempMaxC: 30,
  /** Consecutive wet days before risk is meaningful. */
  wetDays: 3,
  /** A Bordeaux spray needs this many dry hours to dry on the bunch. */
  sprayDryHours: 6,
  /** Protection lasts roughly this long, then it must be repeated. */
  protectionDays: 40,
};

const MONSOON_MONTHS = new Set([5, 6, 7, 8, 9]); // Jun–Oct, 0-indexed

function daysBetween(a: string, b: string): number {
  return Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

function rainNextHours(days: DayWeather[], count: number): number {
  return days.slice(0, count).reduce((sum, d) => sum + d.rainMm, 0);
}

export function irrigationAdvice(farm: Farm, wx: WeatherWindow, today = new Date()): Recommendation {
  const rain48 = rainNextHours(wx.days, 2);

  if (farm.irrigation === "rainfed") {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "info",
      title: "Rainfed garden — nothing to irrigate",
      why: `${rain48.toFixed(0)} mm of rain expected over the next 2 days.`,
    };
  }

  if (rain48 >= RAIN_SKIP_IRRIGATION_MM) {
    // Diesel/electricity saved is the concrete win the farmer feels.
    const saved = Math.round(farm.acres * 180);
    return {
      id: "irrigation",
      icon: "💧",
      severity: "act",
      title: "Do not irrigate today",
      why: `${rain48.toFixed(0)} mm of rain is expected in the next 48 hours — that is more than your garden needs.`,
      rupeeImpact: saved,
      window: "Today",
    };
  }

  const interval = IRRIGATION_INTERVAL_DAYS[farm.irrigation];
  const since = farm.lastIrrigatedAt
    ? daysBetween(farm.lastIrrigatedAt, today.toISOString())
    : interval;
  const due = interval - since;

  if (due <= 0) {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "act",
      title: "Irrigate today",
      why: `${since} days since your last irrigation and only ${rain48.toFixed(0)} mm of rain is expected. Your ${farm.irrigation} system is on a ${interval}-day cycle.`,
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
 * The single most valuable output of this product.
 *
 * Koleroga can take 30–50% of a coastal arecanut crop in a bad monsoon, and the
 * only defence is prophylactic Bordeaux mixture applied *before* the infection
 * window and given time to dry. Farmers routinely lose sprays to rain returning
 * two hours later. Government portals publish rainfall; none of them tell you
 * "spray Thursday between 9am and 3pm."
 */
export function korelogaAdvice(farm: Farm, wx: WeatherWindow, today = new Date()): Recommendation {
  const inMonsoon = MONSOON_MONTHS.has(today.getMonth());

  const wetStreak = wx.days.filter(
    (d) =>
      d.rainMm > 2 &&
      d.humidityMaxPct >= KOLEROGA.humidityPct &&
      d.tempMinC >= KOLEROGA.tempMinC &&
      d.tempMaxC <= KOLEROGA.tempMaxC,
  ).length;

  const sinceSpray = farm.lastSprayAt ? daysBetween(farm.lastSprayAt, today.toISOString()) : 999;
  const protectionLeft = KOLEROGA.protectionDays - sinceSpray;

  // Find the first day that offers a workable spray window.
  const sprayDay = wx.days.find((d) => d.dryHours >= KOLEROGA.sprayDryHours);

  const atRisk = inMonsoon && wetStreak >= KOLEROGA.wetDays;

  if (protectionLeft > 7 && atRisk) {
    return {
      id: "koleroga",
      icon: "🌂",
      severity: "info",
      title: "Koleroga conditions present — you are still protected",
      why: `${wetStreak} wet days ahead with humidity above ${KOLEROGA.humidityPct}%, but your Bordeaux spray from ${sinceSpray} days ago still has about ${protectionLeft} days of cover left.`,
    };
  }

  if (atRisk && protectionLeft <= 7) {
    if (!sprayDay) {
      return {
        id: "koleroga",
        icon: "🌂",
        severity: "urgent",
        title: "Koleroga risk high — no dry window in the next 7 days",
        why: `${wetStreak} days of wet, humid weather ahead and your last spray was ${sinceSpray === 999 ? "not recorded" : sinceSpray + " days ago"}. There is no ${KOLEROGA.sprayDryHours}-hour dry gap in the forecast. Cover the bunches if you can and watch for nut fall.`,
      };
    }
    const day = new Date(sprayDay.date);
    return {
      id: "koleroga",
      icon: "🌂",
      severity: "urgent",
      title: `Spray Bordeaux 1% on ${day.toLocaleDateString("en-IN", { weekday: "long" })}`,
      why: `Koleroga weather is setting in (${wetStreak} wet days, humidity above ${KOLEROGA.humidityPct}%) and your protection has run out. ${day.toLocaleDateString("en-IN", { weekday: "long" })} has about ${sprayDay.dryHours} dry hours — the only workable window this week.`,
      // A lost crop share on a mature garden, valued conservatively.
      rupeeImpact: Math.round(farm.acres * 9 * 30_000 * 0.3),
      window: `${day.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, roughly ${sprayDay.dryHours} dry hours`,
    };
  }

  if (inMonsoon && protectionLeft <= 0) {
    return {
      id: "koleroga",
      icon: "🌂",
      severity: "watch",
      title: "Bordeaux cover has expired",
      why:
        sinceSpray === 999
          ? "No prophylactic spray recorded this season. Standard practice is a 1% Bordeaux spray before the monsoon and again after about 40 days."
          : `Your last spray was ${sinceSpray} days ago; cover lasts about ${KOLEROGA.protectionDays} days.`,
    };
  }

  return {
    id: "koleroga",
    icon: "🌂",
    severity: "info",
    title: "Koleroga risk low",
    why: inMonsoon
      ? `Only ${wetStreak} day(s) in the forecast meet the infection conditions.`
      : "Outside the monsoon infection window.",
  };
}

/** Yellow Leaf Disease has no cure, so the product's job is early detection. */
export function yldPrompt(farm: Farm): Recommendation {
  const age = new Date().getFullYear() - farm.plantedYear;
  return {
    id: "yld",
    icon: "📸",
    severity: "watch",
    title: "Photograph any yellowing fronds",
    why: `Yellow Leaf Disease is spreading through ${farm.district}. It cannot be cured, so the only thing that helps is catching it early enough to stop replanting into an infected block. Your garden is ${age} years old.`,
    window: "Weekly",
  };
}

export function agronomyPlan(farm: Farm, wx: WeatherWindow, today = new Date()): Recommendation[] {
  return [irrigationAdvice(farm, wx, today), korelogaAdvice(farm, wx, today), yldPrompt(farm)];
}
