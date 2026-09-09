import { cropName, getCrop, gradeLabel } from "./crops";
import { farmSizeLabel } from "./crops/planting";
import { t, type Lang } from "./i18n";
import { rankSellOptions } from "./engine/market";
import type { Farm, FarmPlan } from "./types";

/**
 * The day's plan as a WhatsApp message.
 *
 * Farmers do not open apps; they read WhatsApp. Sending the plan there rather
 * than waiting to be visited is the whole point.
 *
 * This module has no "use client" and touches no browser API, because the 5am
 * job builds the same message on the server. Keep it that way — anything that
 * reaches for window belongs in share.ts instead.
 *
 * The recommendations arrive here already in the farmer's language, because the
 * engine builds them that way, so nothing is translated twice.
 */

/** Only the actionable lines; a wall of text does not get read on a phone. */
const WORTH_SENDING = new Set(["urgent", "act", "watch"]);

export function buildShareMessage(farm: Farm, plan: FarmPlan, lang: Lang): string {
  const crop = getCrop(farm.cropId);
  const date = new Date().toLocaleDateString(`${lang}-IN`, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const lines: string[] = [
    `🌴 *${t(lang, "shareToday")}*`,
    `${cropName(crop, lang)} · ${farmSizeLabel(farm, lang)}${farm.village ? ` · ${farm.village}` : ""}`,
    date,
    "",
  ];

  for (const rec of plan.recommendations) {
    if (!WORTH_SENDING.has(rec.severity)) continue;
    lines.push(`${rec.icon} *${rec.title}*`);
    lines.push(rec.why);
    lines.push("");
  }

  lines.push(priceLine(farm, plan, lang));

  if (plan.economics.bearing && plan.economics.priceKnown) {
    lines.push(
      `📊 ${t(lang, "expectedProfit")}: ₹${plan.economics.expectedProfit.toLocaleString("en-IN")}`,
    );
  }

  lines.push("", `— ${t(lang, "shareFrom")}`);
  return lines.join("\n");
}

/**
 * Today's price for what this farmer actually holds, at the yard that pays most
 * after transport — the same figure the sell screen ranks on, not a headline
 * state average that nobody can realise.
 */
function priceLine(farm: Farm, plan: FarmPlan, lang: Lang): string {
  const market = plan.market;
  if (!market || market.quotes.length === 0) return `💰 ${t(lang, "shareNoPrice")}`;

  const crop = getCrop(farm.cropId);
  const held = Object.entries(farm.stockQtl).filter(([, q]) => q > 0);

  if (held.length > 0) {
    const [grade, qtl] = held[0];
    const best = rankSellOptions(farm, market, grade, qtl)[0];
    if (best) {
      return `💰 ${t(lang, "sharePrice", {
        grade: gradeLabel(crop, grade, lang),
        price: best.quote.modalPerQtl.toLocaleString("en-IN"),
        market: best.quote.market,
      })}`;
    }
  }

  const top = market.quotes.slice().sort((a, b) => b.modalPerQtl - a.modalPerQtl)[0];
  return `💰 ${t(lang, "sharePrice", {
    grade: gradeLabel(crop, top.grade, lang),
    price: top.modalPerQtl.toLocaleString("en-IN"),
    market: top.market,
  })}`;
}
