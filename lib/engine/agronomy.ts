import type { CropConfig, DiseaseRule } from "../crops";
import { cropName } from "../crops";
import { t, type Lang } from "../i18n";
import { msg } from "../messages";
import type { DayWeather, Farm, Recommendation, WeatherWindow } from "../types";

/**
 * Weather-driven agronomy, generalised across crops and languages.
 *
 * Nothing here knows what crop it is looking at — it reads thresholds off the
 * CropConfig — and nothing here writes an English sentence: wording lives in
 * lib/messages.ts and this file supplies the key and the numbers. The rules
 * stay deterministic on purpose. An LLM may translate a recommendation, but a
 * hallucinated fungicide dose is a destroyed crop, so the model never
 * originates one.
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

/** Weekday and date in the farmer's own language, via the platform locale. */
function weekday(date: Date, lang: Lang): string {
  return date.toLocaleDateString(`${lang}-IN`, { weekday: "long" });
}

export function irrigationAdvice(
  farm: Farm,
  crop: CropConfig,
  wx: WeatherWindow,
  lang: Lang,
  today = new Date(),
): Recommendation {
  const rain48 = rainOver(wx.days, 2);
  const { intervalDays, rainSkipMm } = crop.irrigation;
  const name = cropName(crop, lang);
  const rain = rain48.toFixed(0);

  if (farm.irrigation === "rainfed") {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "info",
      title: msg(lang, "irr.rainfed.t"),
      why: msg(lang, "irr.rainfed.w", { rain }),
    };
  }

  if (rain48 >= rainSkipMm) {
    // Diesel and pump time saved is the concrete win the farmer feels.
    return {
      id: "irrigation",
      icon: "💧",
      severity: "act",
      title: msg(lang, "irr.skip.t"),
      why: msg(lang, "irr.skip.w", { rain, crop: name }),
      rupeeImpact: Math.round(farm.acres * 180),
      window: msg(lang, "win.today"),
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
      title: msg(lang, "irr.due.t"),
      why: msg(lang, "irr.due.w", {
        since,
        rain,
        method: t(lang, `irr.${farm.irrigation}`),
        interval,
        crop: name,
      }),
      window: msg(lang, "win.today"),
    };
  }

  const when = new Date(today.getTime() + due * 86_400_000);
  return {
    id: "irrigation",
    icon: "💧",
    severity: "info",
    title: due === 1 ? msg(lang, "irr.next1.t") : msg(lang, "irr.next.t", { due }),
    why: msg(lang, "irr.next.w", { since, interval }),
    window: weekday(when, lang),
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
  lang: Lang,
  today = new Date(),
): Recommendation {
  const inSeason = rule.months.includes(today.getMonth() + 1);
  const disease = rule.name[lang === "kn" ? "kn" : "en"] ?? rule.name.en;
  const treatment = rule.treatment.name[lang === "kn" ? "kn" : "en"] ?? rule.treatment.name.en;

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
      title: msg(lang, "dis.safe.t", { disease }),
      why: msg(lang, "dis.safe.w", {
        wetDays,
        humidity: rule.humidityPct,
        since: sinceSpray,
        left: protectionLeft,
      }),
    };
  }

  if (atRisk) {
    if (!sprayDay) {
      return {
        id: rule.id,
        icon: "🌂",
        severity: "urgent",
        title: msg(lang, "dis.nowindow.t", { disease }),
        why: msg(lang, "dis.nowindow.w", { wetDays, hours: rule.treatment.dryHours }),
        rupeeImpact: -atStake,
      };
    }
    const date = new Date(sprayDay.date);
    const day = weekday(date, lang);
    return {
      id: rule.id,
      icon: "🌂",
      severity: "urgent",
      title: msg(lang, "dis.spray.t", { treatment, day }),
      why: msg(lang, "dis.spray.w", {
        disease,
        wetDays,
        humidity: rule.humidityPct,
        day,
        dryHours: sprayDay.dryHours,
      }),
      rupeeImpact: -atStake,
      window: date.toLocaleDateString(`${lang}-IN`, { day: "numeric", month: "short" }),
    };
  }

  if (inSeason && protectionLeft <= 0) {
    return {
      id: rule.id,
      icon: "🌂",
      severity: "watch",
      title: msg(lang, "dis.expired.t", { treatment }),
      why: Number.isFinite(sinceSpray)
        ? msg(lang, "dis.expired.w", { since: sinceSpray, days: rule.treatment.protectionDays })
        : msg(lang, "dis.never.w", { disease }),
    };
  }

  return {
    id: rule.id,
    icon: "🌂",
    severity: "info",
    title: msg(lang, "dis.low.t", { disease }),
    why: inSeason ? msg(lang, "dis.low.w", { wetDays }) : msg(lang, "dis.off.w", { disease }),
  };
}

/** A crop the registry does not know says so, rather than advising blindly. */
export function coverageNote(crop: CropConfig, lang: Lang): Recommendation {
  return {
    id: "coverage",
    icon: "📋",
    severity: "info",
    title: msg(lang, "cover.t", { crop: cropName(crop, lang) }),
    why: msg(lang, "cover.w"),
  };
}

export function agronomyPlan(
  farm: Farm,
  crop: CropConfig,
  wx: WeatherWindow,
  pricePerQtl: number,
  expectedQtl: number,
  lang: Lang,
  today = new Date(),
): Recommendation[] {
  const out: Recommendation[] = [irrigationAdvice(farm, crop, wx, lang, today)];

  for (const rule of crop.diseases) {
    out.push(diseaseAdvice(farm, crop, rule, wx, pricePerQtl, expectedQtl, lang, today));
  }

  if (crop.diseases.length === 0) out.push(coverageNote(crop, lang));

  if (crop.notes) {
    out.push({
      id: "crop-note",
      icon: "📸",
      severity: "watch",
      title: msg(lang, "crop.note.t", { crop: cropName(crop, lang) }),
      // Crop notes are free text in the registry and exist only in English.
      why: crop.notes,
      window: msg(lang, "win.weekly"),
    });
  }

  return out;
}
