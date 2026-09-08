import type { ArecaGrade, Economics, Farm, MandiQuote, MarketView, Recommendation } from "../types";
import { GRADE_LABEL } from "../grades";

/**
 * The sell-side engine.
 *
 * This is where the money is. Agmarknet shows arecanut trading at wildly
 * different prices on the same day depending on grade and mandi — Rashi around
 * ₹509/kg at Yellapur against CQCA at ₹270/kg at Sullia. A grower who carries
 * the right grade to the right yard on the right day realises materially more
 * for the same crop, and almost nobody computes that trade-off with transport
 * netted out. Government portals publish the prices; they do not do this sum.
 */

/** Approximate hired-tempo cost, rupees per km, round trip. */
const TRANSPORT_RUPEES_PER_KM = 42;
/** A hired tempo carries roughly this much before you need a second trip. */
const LOAD_CAPACITY_QTL = 20;
/** Ignore an alternative mandi unless it beats the local one by this much. */
const MIN_WORTHWHILE_GAIN = 2_000;

/** Coordinates for the APMCs that actually quote arecanut in Karnataka. */
export const MANDI_GAZETTEER: Record<string, { lat: number; lon: number; district: string }> = {
  Kumta: { lat: 14.4258, lon: 74.4189, district: "Uttara Kannada" },
  Yellapur: { lat: 14.964, lon: 74.708, district: "Uttara Kannada" },
  Sirsi: { lat: 14.6195, lon: 74.8354, district: "Uttara Kannada" },
  Siddapur: { lat: 14.3436, lon: 74.8946, district: "Uttara Kannada" },
  Puttur: { lat: 12.7597, lon: 75.2, district: "Dakshina Kannada" },
  Sullia: { lat: 12.56, lon: 75.387, district: "Dakshina Kannada" },
  Bantwal: { lat: 12.89, lon: 75.035, district: "Dakshina Kannada" },
  Mangaluru: { lat: 12.87, lon: 74.88, district: "Dakshina Kannada" },
  Belthangady: { lat: 13.0, lon: 75.3, district: "Dakshina Kannada" },
  Karkala: { lat: 13.215, lon: 74.99, district: "Udupi" },
  Kundapura: { lat: 13.625, lon: 74.69, district: "Udupi" },
  Shivamogga: { lat: 13.9299, lon: 75.5681, district: "Shivamogga" },
  Sagar: { lat: 14.1667, lon: 75.0333, district: "Shivamogga" },
  Tirthahalli: { lat: 13.689, lon: 75.247, district: "Shivamogga" },
  Hosanagara: { lat: 13.913, lon: 75.06, district: "Shivamogga" },
  Channagiri: { lat: 14.024, lon: 75.926, district: "Davanagere" },
  Davangere: { lat: 14.4644, lon: 75.9218, district: "Davanagere" },
  Holalkere: { lat: 14.045, lon: 76.185, district: "Chitradurga" },
  Chitradurga: { lat: 14.2251, lon: 76.398, district: "Chitradurga" },
};

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function transportCost(distanceKm: number, quintals: number): number {
  const trips = Math.max(1, Math.ceil(quintals / LOAD_CAPACITY_QTL));
  return Math.round(distanceKm * TRANSPORT_RUPEES_PER_KM * trips);
}

export interface SellOption {
  quote: MandiQuote;
  quintals: number;
  gross: number;
  transport: number;
  net: number;
}

/** Rank every mandi quoting this grade by what the farmer actually pockets. */
export function rankSellOptions(
  farm: Farm,
  market: MarketView,
  grade: ArecaGrade,
  quintals: number,
): SellOption[] {
  return market.quotes
    .filter((q) => q.grade === grade)
    .map((q) => {
      const geo = MANDI_GAZETTEER[q.market];
      const distanceKm = geo ? haversineKm(farm.lat, farm.lon, geo.lat, geo.lon) : 60;
      const gross = q.modalPerQtl * quintals;
      const transport = transportCost(distanceKm, quintals);
      return {
        quote: { ...q, distanceKm: Math.round(distanceKm) },
        quintals,
        gross,
        transport,
        net: gross - transport,
      };
    })
    .sort((a, b) => b.net - a.net);
}

export function sellAdvice(farm: Farm, market: MarketView | null): Recommendation[] {
  if (!market || market.quotes.length === 0) {
    return [
      {
        id: "market",
        icon: "💰",
        severity: "info",
        title: "Market prices unavailable",
        why: "Could not reach the Agmarknet feed. Prices will refresh automatically.",
      },
    ];
  }

  const out: Recommendation[] = [];

  for (const [gradeKey, qtl] of Object.entries(farm.stockQtl)) {
    const grade = gradeKey as ArecaGrade;
    if (!qtl || qtl <= 0) continue;

    const options = rankSellOptions(farm, market, grade, qtl);
    if (options.length === 0) continue;

    const best = options[0];
    const label = GRADE_LABEL[grade].en;
    const trend = market.weekChangePct[grade] ?? 0;

    // Is it worth driving past the nearest yard?
    const nearest = [...options].sort(
      (a, b) => (a.quote.distanceKm ?? 999) - (b.quote.distanceKm ?? 999),
    )[0];
    const gain = best.net - nearest.net;

    if (best.quote.market !== nearest.quote.market && gain >= MIN_WORTHWHILE_GAIN) {
      out.push({
        id: `sell-${grade}`,
        icon: "🚚",
        severity: "act",
        title: `Take your ${label} to ${best.quote.market}, not ${nearest.quote.market}`,
        why: `${best.quote.market} is quoting ₹${best.quote.modalPerQtl.toLocaleString("en-IN")}/qtl against ₹${nearest.quote.modalPerQtl.toLocaleString("en-IN")} at ${nearest.quote.market}. On ${qtl} quintals that is ₹${(best.gross - nearest.gross).toLocaleString("en-IN")} more, and the extra ${Math.max(0, (best.quote.distanceKm ?? 0) - (nearest.quote.distanceKm ?? 0))} km costs about ₹${(best.transport - nearest.transport).toLocaleString("en-IN")} in transport.`,
        rupeeImpact: Math.round(gain),
        window: `Prices dated ${best.quote.date}`,
      });
    }

    if (trend <= -3) {
      out.push({
        id: `trend-${grade}`,
        icon: "📉",
        severity: "act",
        title: `${label} has fallen ${Math.abs(trend).toFixed(1)}% this week`,
        why: `Your ${qtl} quintals are worth about ₹${Math.round((best.net * Math.abs(trend)) / 100).toLocaleString("en-IN")} less than last week. Arecanut stores well, but the trend is down — consider releasing part of the stock rather than waiting for a bounce.`,
        rupeeImpact: -Math.round((best.net * Math.abs(trend)) / 100),
      });
    } else if (trend >= 3) {
      out.push({
        id: `trend-${grade}`,
        icon: "📈",
        severity: "watch",
        title: `${label} is up ${trend.toFixed(1)}% this week`,
        why: `Holding has paid off so far. Today ${best.quote.market} nets you ₹${best.net.toLocaleString("en-IN")} for ${qtl} quintals after transport.`,
        rupeeImpact: Math.round((best.net * trend) / 100),
      });
    }
  }

  if (out.length === 0) {
    const held = (Object.entries(farm.stockQtl) as [ArecaGrade, number][]).filter(
      ([, q]) => q && q > 0,
    );

    if (held.length > 0) {
      // Nothing is urgent, so report what the stock is worth and where.
      const [grade, qtl] = held[0];
      const best = rankSellOptions(farm, market, grade, qtl)[0];
      if (best) {
        out.push({
          id: "market",
          icon: "💰",
          severity: "info",
          title: `Your ${GRADE_LABEL[grade].en} is worth ₹${best.net.toLocaleString("en-IN")} today`,
          why: `${qtl} quintals at ${best.quote.market}'s ₹${best.quote.modalPerQtl.toLocaleString("en-IN")}/qtl, less ₹${best.transport.toLocaleString("en-IN")} to get it there. No other yard is far enough ahead to be worth the extra distance.`,
        });
      }
    } else {
      const top = market.quotes.slice().sort((a, b) => b.modalPerQtl - a.modalPerQtl)[0];
      out.push({
        id: "market",
        icon: "💰",
        severity: "info",
        title: `${GRADE_LABEL[top.grade].en} at ₹${top.modalPerQtl.toLocaleString("en-IN")}/qtl`,
        why: `Best quote today is ${top.market}. Add your unsold stock to get sell recommendations.`,
      });
    }
  }

  return out;
}

/** Expected yield curve for an arecanut garden, in quintals of chali per acre. */
export function expectedYieldPerAcre(plantedYear: number, today = new Date()): number {
  const age = today.getFullYear() - plantedYear;
  if (age < 5) return 0;
  if (age === 5) return 2.7;
  if (age === 6) return 4.5;
  if (age === 7) return 6.8;
  if (age <= 40) return 9;
  // Old gardens taper off.
  return Math.max(3, 9 - (age - 40) * 0.3);
}

export function economics(farm: Farm, market: MarketView | null, costs: number): Economics {
  const yieldQtl = expectedYieldPerAcre(farm.plantedYear) * farm.acres;
  const primary = farm.grades[0] ?? "rashi";
  const price =
    market?.stateModal[primary] ??
    (market?.quotes.find((q) => q.grade === primary)?.modalPerQtl ?? 35_000);

  const revenue = Math.round(yieldQtl * price);
  const trend = market?.weekChangePct[primary] ?? 0;

  return {
    expectedYieldQtl: Math.round(yieldQtl * 10) / 10,
    expectedRevenue: revenue,
    totalCosts: costs,
    expectedProfit: revenue - costs,
    weekDeltaRupees: Math.round((revenue * trend) / 100),
  };
}
