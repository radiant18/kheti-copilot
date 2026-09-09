import type { CropConfig, DiseaseRule } from "../crops";
import { cropName } from "../crops";
import { t, type Lang } from "../i18n";
import { msg } from "../messages";
import type { DayWeather, Farm, Recommendation, WeatherWindow } from "../types";
import { waterBalance } from "./water";
import { diseasePressure, nextSprayWindow } from "./pressure";

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
): Recommendation {
  if (farm.irrigation === "rainfed") {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "info",
      title: msg(lang, "irr.rainfed.t"),
      why: msg(lang, "irr.rainfed.w", { rain: rainOver(wx.days, 2).toFixed(0) }),
    };
  }

  const bal = waterBalance(farm, wx);

  // Without history there is no balance to report; say nothing rather than guess.
  if (!bal) {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "info",
      title: msg(lang, "water.ok.t"),
      why: msg(lang, "irr.rainfed.w", { rain: rainOver(wx.days, 2).toFixed(0) }),
    };
  }

  if (bal.deficitMm <= 0) {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "info",
      title: msg(lang, "water.ok.t"),
      why: msg(lang, "water.ok.w", { days: bal.days, used: bal.usedMm, rain: bal.rainMm }),
    };
  }

  if (bal.rainWillCover) {
    return {
      id: "irrigation",
      icon: "💧",
      severity: "act",
      title: msg(lang, "water.wait.t"),
      why: msg(lang, "water.wait.w", { deficit: bal.deficitMm, ahead: bal.rainAheadMm }),
      // Diesel and pump time not spent is money the farmer can feel.
      rupeeImpact: Math.round(farm.acres * 180),
      window: msg(lang, "win.today"),
    };
  }

  return {
    id: "irrigation",
    icon: "💧",
    severity: "act",
    title: msg(lang, "water.t", { deficit: bal.deficitMm }),
    why:
      bal.litresPerPlant !== undefined
        ? msg(lang, "water.w", {
            days: bal.days,
            used: bal.usedMm,
            rain: bal.rainMm,
            litres: bal.litresPerPlant,
          })
        : msg(lang, "water.area.w", { days: bal.days, used: bal.usedMm, rain: bal.rainMm }),
    window: msg(lang, "win.today"),
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
  const disease = rule.name[lang === "kn" ? "kn" : "en"] ?? rule.name.en;
  const treatment = rule.treatment.name[lang === "kn" ? "kn" : "en"] ?? rule.treatment.name.en;
  const inSeason = rule.months.includes(today.getMonth() + 1);

  const pressure = diseasePressure(rule, wx, today);
  const atStake = Math.round(expectedQtl * pricePerQtl * rule.lossShare);

  if (!pressure || !inSeason || pressure.fraction < 0.5) {
    return {
      id: rule.id,
      icon: "🌂",
      severity: "info",
      title: msg(lang, "press.low.t", { disease }),
      why:
        inSeason && pressure
          ? msg(lang, "press.low.w", {
              disease,
              hours: pressure.hoursSoFar,
              threshold: pressure.threshold,
            })
          : msg(lang, "dis.off.w", { disease }),
    };
  }

  const window = nextSprayWindow(wx, rule.treatment.dryHours, 85, today);
  const clock = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;

  // Pressure is building but there is nowhere to put a spray this week.
  if (!window) {
    return {
      id: rule.id,
      icon: "🌂",
      severity: "urgent",
      title: msg(lang, "press.t", { disease }),
      why: msg(lang, "press.ahead.w", {
        hours: pressure.hoursSoFar,
        ahead: pressure.hoursAhead,
        disease,
        threshold: pressure.threshold,
      }),
      rupeeImpact: -atStake,
    };
  }

  const day = weekday(new Date(window.date), lang);

  return {
    id: rule.id,
    icon: "🌂",
    severity: pressure.fraction >= 1 ? "urgent" : "act",
    title: msg(lang, "spray.t", {
      treatment,
      day,
      from: clock(window.fromHour),
      to: clock(window.toHour),
    }),
    why: `${msg(lang, "press.w", {
      disease,
      hours: pressure.hoursSoFar,
      threshold: pressure.threshold,
      run: pressure.longestRunHours,
    })} ${
      window.rainReturnsHour !== undefined
        ? msg(lang, "spray.rain.w", { hours: window.hours, rain: clock(window.rainReturnsHour) })
        : msg(lang, "spray.w", { hours: window.hours })
    }`,
    rupeeImpact: -atStake,
    window: `${day} ${clock(window.fromHour)}–${clock(window.toHour)}`,
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
  const out: Recommendation[] = [irrigationAdvice(farm, crop, wx, lang)];

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
