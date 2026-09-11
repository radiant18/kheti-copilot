import { cropName, getCrop, gradeLabel } from "../crops";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { Farm, FarmPlan } from "../types";
import { currentConditions } from "./conditions";
import { rankSellOptions } from "./market";
import { fertiliserStatus } from "./nutrition";
import { waterBalance } from "./water";

/**
 * The five cards on the Today screen, always in the same order.
 *
 * This is a deliberate change from ranking by urgency. Ranking put the most
 * expensive thing first, which is right for a reader who studies the screen —
 * but the screen is checked in thirty seconds every morning, and a farmer who
 * learns "water is the first box, fertiliser the second" can go straight to
 * what they came for. Fixed position beats optimal order when the reader is
 * the same person every day. Urgency still shows, in the tone of each card.
 *
 * Every card answers its question even when the answer is "no" or "we do not
 * know", because a missing card reads as a missing problem.
 */

export type Tone = "urgent" | "act" | "watch" | "calm" | "unknown";

export interface TodayCard {
  id: "water" | "fertiliser" | "weather" | "price" | "protect";
  icon: string;
  /** Short label above the headline: what question this box answers. */
  kicker: string;
  headline: string;
  /** The reasoning, in the farmer's language. */
  detail: string;
  tone: Tone;
  /** Rupees at stake, signed, when the card can honestly put a figure on it. */
  rupees?: number;
  /** Set when the card needs the farmer to tell us something. */
  action?: { kind: "recordFertiliser"; label: string };
  /** Where tapping the card goes, when there is more to see. */
  href?: string;
}

function fmtDate(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleDateString(`${lang}-IN`, { day: "numeric", month: "short" });
}

/** 1 — Do I water today, and if not, why not. */
function waterCard(farm: Farm, plan: FarmPlan, lang: Lang): TodayCard {
  const balance = waterBalance(farm, plan.weather);
  const kicker = t(lang, "cardWater");

  if (!balance) {
    return {
      id: "water", icon: "💧", kicker, tone: "unknown",
      headline: t(lang, "waterUnknown"),
      detail: t(lang, "waterUnknownWhy"),
    };
  }

  if (farm.irrigation === "rainfed") {
    return {
      id: "water", icon: "🌧️", kicker, tone: "calm",
      headline: t(lang, "waterRainfed"),
      detail: t(lang, "waterRainfedWhy", { rain: balance.rainAheadMm.toFixed(0) }),
    };
  }

  // Rain on the way that covers the gap is the most valuable "no" the app
  // gives: it is the case where a farmer would otherwise have watered anyway.
  if (balance.rainWillCover) {
    return {
      id: "water", icon: "🌧️", kicker, tone: "calm",
      headline: t(lang, "waterNo"),
      detail: t(lang, "waterNoWhy", {
        rain: balance.rainAheadMm.toFixed(0),
        deficit: Math.max(0, balance.deficitMm).toFixed(0),
      }),
      rupees: Math.round(farm.acres * 180),
    };
  }

  if (balance.deficitMm <= 0) {
    return {
      id: "water", icon: "💧", kicker, tone: "calm",
      headline: t(lang, "waterNotYet"),
      detail: t(lang, "waterNotYetWhy", { rain: Math.abs(balance.deficitMm).toFixed(0) }),
    };
  }

  const perPlant = balance.litresPerPlant;
  return {
    id: "water", icon: "💧", kicker, tone: "act",
    headline: t(lang, "waterYes"),
    detail: perPlant
      ? t(lang, "waterYesPerPlant", {
          deficit: balance.deficitMm.toFixed(0),
          litres: Math.round(perPlant),
          days: balance.days,
        })
      : t(lang, "waterYesTotal", {
          deficit: balance.deficitMm.toFixed(0),
          litres: Math.round(balance.totalLitres).toLocaleString("en-IN"),
          days: balance.days,
        }),
  };
}

/** 2 — When did I last fertilise, and when is the next round. */
function fertiliserCard(farm: Farm, lang: Lang, today: Date): TodayCard {
  const crop = getCrop(farm.cropId);
  const status = fertiliserStatus(farm, crop, today);
  const kicker = t(lang, "cardFertiliser");
  const record = { kind: "recordFertiliser" as const, label: t(lang, "fertDidToday") };

  if (status.state === "unknown") {
    return {
      id: "fertiliser", icon: "🌱", kicker, tone: "unknown",
      headline: t(lang, "fertUnknown"),
      detail: t(lang, "fertUnknownWhy", { interval: status.intervalDays }),
      action: record,
    };
  }

  const last = t(lang, "fertLast", {
    date: fmtDate(status.lastAt!, lang),
    days: status.daysSince!,
  });

  if (status.state === "overdue") {
    return {
      id: "fertiliser", icon: "🌱", kicker, tone: "act",
      headline: t(lang, "fertOverdue", { days: Math.abs(status.daysUntilNext!) }),
      detail: `${last} ${t(lang, "fertOverdueWhy", { interval: status.intervalDays })}`,
      action: record,
    };
  }

  if (status.state === "due") {
    return {
      id: "fertiliser", icon: "🌱", kicker, tone: "watch",
      headline: t(lang, "fertDue"),
      detail: `${last} ${t(lang, "fertDueWhy", { date: fmtDate(status.dueOn!, lang) })}`,
      action: record,
    };
  }

  return {
    id: "fertiliser", icon: "🌱", kicker, tone: "calm",
    headline: t(lang, "fertOk", { days: status.daysUntilNext! }),
    detail: `${last} ${t(lang, "fertOkWhy", { date: fmtDate(status.dueOn!, lang) })}`,
    action: record,
  };
}

/** 3 — What it is doing outside now, and for the rest of today. */
function weatherCard(plan: FarmPlan, lang: Lang, today: Date): TodayCard {
  const now = currentConditions(plan.weather, today);
  const kicker = t(lang, "cardWeather");

  if (!now) {
    return {
      id: "weather", icon: "🌤️", kicker, tone: "unknown",
      headline: t(lang, "weatherUnknown"),
      detail: t(lang, "weatherUnknownWhy"),
    };
  }

  const headline = now.rainingNow
    ? t(lang, "weatherRaining", { temp: now.tempC })
    : t(lang, "weatherNow", { temp: now.tempC, humidity: now.humidityPct });

  const detail =
    now.rainRestOfDayMm >= 1 && now.rainStartsHour !== null && !now.rainingNow
      ? t(lang, "weatherRainLater", {
          hour: `${now.rainStartsHour}:00`,
          rain: now.rainRestOfDayMm,
          peak: now.peakTempC,
        })
      : now.rainRestOfDayMm >= 1
        ? t(lang, "weatherWetDay", { rain: now.rainRestOfDayMm, peak: now.peakTempC })
        : t(lang, "weatherDryDay", { hours: now.dryHoursLeft, peak: now.peakTempC });

  return {
    id: "weather", icon: now.rainingNow ? "🌧️" : "🌤️", kicker,
    tone: "calm", headline, detail,
  };
}

/** 4 — What my crop is fetching today. */
function priceCard(farm: Farm, plan: FarmPlan, lang: Lang): TodayCard {
  const crop = getCrop(farm.cropId);
  const market = plan.market;
  const kicker = t(lang, "cardPrice");

  if (!market || market.quotes.length === 0) {
    return {
      id: "price", icon: "💰", kicker, tone: "unknown",
      headline: market?.source === "unconfigured"
        ? t(lang, "mkt.off.t")
        : t(lang, "priceNone", { crop: cropName(crop, lang) }),
      detail: market?.source === "unconfigured" ? t(lang, "mkt.off.w") : t(lang, "mkt.none.w"),
      href: "/market",
    };
  }

  const held = Object.entries(farm.stockQtl).filter(([, q]) => q > 0);
  const top = market.quotes.slice().sort((a, b) => b.modalPerQtl - a.modalPerQtl)[0];

  // Holding stock turns a price into a decision, so lead with what it is worth.
  if (held.length > 0) {
    const [grade, qtl] = held[0];
    const best = rankSellOptions(farm, market, grade, qtl)[0];
    if (best) {
      const second = rankSellOptions(farm, market, grade, qtl)[1];
      return {
        id: "price", icon: "💰", kicker, tone: "watch",
        headline: t(lang, "priceHeld", {
          grade: gradeLabel(crop, grade, lang),
          price: best.quote.modalPerQtl.toLocaleString("en-IN"),
        }),
        detail: t(lang, "priceHeldWhy", {
          qtl,
          net: best.net.toLocaleString("en-IN"),
          market: best.quote.market,
        }),
        rupees: second ? Math.round(best.net - second.net) : undefined,
        href: "/market",
      };
    }
  }

  return {
    id: "price", icon: "💰", kicker, tone: "calm",
    headline: t(lang, "priceTop", {
      grade: gradeLabel(crop, top.grade, lang),
      price: top.modalPerQtl.toLocaleString("en-IN"),
    }),
    detail: t(lang, "priceTopWhy", { market: top.market, date: top.date }),
    href: "/market",
  };
}

/**
 * 5 — The thing a farmer needs that nothing else on the screen covers.
 *
 * Spraying, because it is the one decision here with a deadline the weather
 * sets rather than the farmer: a fungicide window opens and closes, and missing
 * it costs a share of the crop. When no disease is pressing, the slot reports
 * that plainly rather than manufacturing a task.
 */
function protectCard(farm: Farm, plan: FarmPlan, lang: Lang, today: Date): TodayCard {
  const crop = getCrop(farm.cropId);
  const kicker = t(lang, "cardProtect");

  // The recommendation the rules already produced carries the full reasoning;
  // this slot only decides whether it is the thing worth surfacing here.
  for (const rule of crop.diseases) {
    const rec = plan.recommendations.find((r) => r.id === rule.id);
    if (rec && (rec.severity === "urgent" || rec.severity === "act")) {
      return {
        id: "protect", icon: "🌂", kicker,
        tone: rec.severity === "urgent" ? "urgent" : "act",
        headline: rec.title,
        detail: rec.why,
        rupees: rec.rupeeImpact,
      };
    }
  }

  const watching = crop.diseases[0];
  return {
    id: "protect", icon: "🛡️", kicker, tone: "calm",
    headline: t(lang, "protectClear"),
    detail: watching
      ? t(lang, "protectClearWhy", { disease: watching.name[lang === "kn" ? "kn" : "en"] })
      : t(lang, "protectNoRules"),
  };
}

export function todayCards(farm: Farm, plan: FarmPlan, lang: Lang, today = new Date()): TodayCard[] {
  return [
    waterCard(farm, plan, lang),
    fertiliserCard(farm, lang, today),
    weatherCard(plan, lang, today),
    priceCard(farm, plan, lang),
    protectCard(farm, plan, lang, today),
  ];
}
