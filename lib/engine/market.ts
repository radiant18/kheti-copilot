import { getCrop, gradeLabel, harvestOutlook, type CropConfig } from "../crops";
import type { Economics, Farm, Grade, MandiQuote, MarketView, Recommendation } from "../types";

/**
 * The sell-side engine.
 *
 * This is where the money is, and it is crop-agnostic — the same arithmetic
 * that finds a better arecanut yard finds a better tomato yard. Agmarknet
 * publishes wildly different prices for the same commodity on the same day
 * across markets and grades; almost nobody nets transport out of that spread.
 */

/** Approximate hired-tempo cost, rupees per km, round trip. */
const TRANSPORT_RUPEES_PER_KM = 42;
const LOAD_CAPACITY_QTL = 20;
/** Ignore an alternative market unless it beats the local one by this much. */
const MIN_WORTHWHILE_GAIN = 2_000;

/**
 * Coordinates for markets we can place. Agmarknet covers 3,000+ yards and we
 * do not have them all — an unplaced market keeps its price but loses transport
 * netting, and the UI says the distance is unknown rather than guessing.
 */
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
  Udupi: { lat: 13.3409, lon: 74.7421, district: "Udupi" },
  Shivamogga: { lat: 13.9299, lon: 75.5681, district: "Shivamogga" },
  Sagar: { lat: 14.1667, lon: 75.0333, district: "Shivamogga" },
  Tirthahalli: { lat: 13.689, lon: 75.247, district: "Shivamogga" },
  Hosanagara: { lat: 13.913, lon: 75.06, district: "Shivamogga" },
  Bhadravati: { lat: 13.8484, lon: 75.7049, district: "Shivamogga" },
  Channagiri: { lat: 14.024, lon: 75.926, district: "Davanagere" },
  Davangere: { lat: 14.4644, lon: 75.9218, district: "Davanagere" },
  Holalkere: { lat: 14.045, lon: 76.185, district: "Chitradurga" },
  Chitradurga: { lat: 14.2251, lon: 76.398, district: "Chitradurga" },
  Bengaluru: { lat: 12.9716, lon: 77.5946, district: "Bengaluru" },
  Kolar: { lat: 13.1362, lon: 78.1291, district: "Kolar" },
  Chikkaballapur: { lat: 13.4355, lon: 77.7315, district: "Chikkaballapur" },
  Mysuru: { lat: 12.2958, lon: 76.6394, district: "Mysuru" },
  Hassan: { lat: 13.0072, lon: 76.0962, district: "Hassan" },
  Arasikere: { lat: 13.314, lon: 76.257, district: "Hassan" },
  Chikkamagaluru: { lat: 13.3161, lon: 75.7720, district: "Chikkamagaluru" },
  Madikeri: { lat: 12.4244, lon: 75.7382, district: "Kodagu" },
  Hubballi: { lat: 15.3647, lon: 75.124, district: "Dharwad" },
  Belagavi: { lat: 15.8497, lon: 74.4977, district: "Belagavi" },
  Kalaburagi: { lat: 17.3297, lon: 76.8343, district: "Kalaburagi" },
  Ballari: { lat: 15.1394, lon: 76.9214, district: "Ballari" },
  Tumakuru: { lat: 13.3379, lon: 77.101, district: "Tumakuru" },
  Mandya: { lat: 12.5223, lon: 76.8955, district: "Mandya" },
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
  /** False when the market is not in the gazetteer, so transport is a guess of zero. */
  distanceKnown: boolean;
}

/** Rank every market quoting this grade by what the farmer actually pockets. */
export function rankSellOptions(
  farm: Farm,
  market: MarketView,
  grade: Grade,
  quintals: number,
): SellOption[] {
  return market.quotes
    .filter((q) => q.grade === grade)
    .map((q) => {
      const geo = MANDI_GAZETTEER[q.market];
      const distanceKm = geo ? haversineKm(farm.lat, farm.lon, geo.lat, geo.lon) : null;
      const gross = q.modalPerQtl * quintals;
      const transport = distanceKm === null ? 0 : transportCost(distanceKm, quintals);
      return {
        quote: { ...q, distanceKm: distanceKm === null ? undefined : Math.round(distanceKm) },
        quintals,
        gross,
        transport,
        net: gross - transport,
        distanceKnown: distanceKm !== null,
      };
    })
    .sort((a, b) => b.net - a.net);
}

export function sellAdvice(farm: Farm, crop: CropConfig, market: MarketView | null): Recommendation[] {
  if (!market || market.quotes.length === 0) {
    return [
      {
        id: "market",
        icon: "💰",
        severity: "info",
        title: `No ${crop.name.en.toLowerCase()} prices today`,
        why: "Agmarknet had no quotes for this crop in your state. Prices refresh through the day; some yards report late.",
      },
    ];
  }

  const out: Recommendation[] = [];

  for (const [grade, qtl] of Object.entries(farm.stockQtl)) {
    if (!qtl || qtl <= 0) continue;

    const options = rankSellOptions(farm, market, grade, qtl);
    if (options.length === 0) continue;

    const best = options[0];
    const label = gradeLabel(crop, grade);
    const trend = market.weekChangePct[grade] ?? 0;

    const placed = options.filter((o) => o.distanceKnown);
    const nearest = placed.sort((a, b) => (a.quote.distanceKm ?? 0) - (b.quote.distanceKm ?? 0))[0];
    const gain = nearest ? best.net - nearest.net : 0;

    if (nearest && best.quote.market !== nearest.quote.market && gain >= MIN_WORTHWHILE_GAIN) {
      out.push({
        id: `sell-${grade}`,
        icon: "🚚",
        severity: "act",
        title: `Take your ${label} to ${best.quote.market}, not ${nearest.quote.market}`,
        why: `${best.quote.market} is quoting ₹${best.quote.modalPerQtl.toLocaleString("en-IN")}/qtl against ₹${nearest.quote.modalPerQtl.toLocaleString("en-IN")} at ${nearest.quote.market}. On ${qtl} quintals that is ₹${(best.gross - nearest.gross).toLocaleString("en-IN")} more, and the extra distance costs about ₹${(best.transport - nearest.transport).toLocaleString("en-IN")} in transport.`,
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
        why: `Your ${qtl} quintals are worth about ₹${Math.round((best.net * Math.abs(trend)) / 100).toLocaleString("en-IN")} less than last week. Consider releasing part of the stock rather than waiting for a bounce.`,
        rupeeImpact: -Math.round((best.net * Math.abs(trend)) / 100),
      });
    } else if (trend >= 3) {
      out.push({
        id: `trend-${grade}`,
        icon: "📈",
        severity: "watch",
        title: `${label} is up ${trend.toFixed(1)}% this week`,
        why: `Holding has paid off so far. Today ${best.quote.market} nets you ₹${best.net.toLocaleString("en-IN")} for ${qtl} quintals.`,
        rupeeImpact: Math.round((best.net * trend) / 100),
      });
    }
  }

  if (out.length === 0) {
    const held = Object.entries(farm.stockQtl).filter(([, q]) => q && q > 0);

    if (held.length > 0) {
      const [grade, qtl] = held[0];
      const best = rankSellOptions(farm, market, grade, qtl)[0];
      if (best) {
        out.push({
          id: "market",
          icon: "💰",
          severity: "info",
          title: `Your ${gradeLabel(crop, grade)} is worth ₹${best.net.toLocaleString("en-IN")} today`,
          why: `${qtl} quintals at ${best.quote.market}'s ₹${best.quote.modalPerQtl.toLocaleString("en-IN")}/qtl${best.distanceKnown ? `, less ₹${best.transport.toLocaleString("en-IN")} to get it there` : ""}. No other yard is far enough ahead to be worth the extra distance.`,
        });
      }
    } else {
      const top = market.quotes.slice().sort((a, b) => b.modalPerQtl - a.modalPerQtl)[0];
      out.push({
        id: "market",
        icon: "💰",
        severity: "info",
        title: `${gradeLabel(crop, top.grade)} at ₹${top.modalPerQtl.toLocaleString("en-IN")}/qtl`,
        why: `Best quote today is ${top.market}. Add your unsold stock to get sell recommendations.`,
      });
    }
  }

  return out;
}

/** Best available price per quintal for a farm's crop, used for valuation. */
export function referencePrice(farm: Farm, market: MarketView | null): number {
  if (!market || market.quotes.length === 0) return 0;
  const held = Object.keys(farm.stockQtl).filter((g) => farm.stockQtl[g] > 0);
  const grade = held[0];
  if (grade && market.stateModal[grade]) return market.stateModal[grade];
  const modals = Object.values(market.stateModal);
  if (modals.length > 0) return Math.round(modals.reduce((s, v) => s + v, 0) / modals.length);
  return market.quotes[0].modalPerQtl;
}

export function economics(farm: Farm, market: MarketView | null, costs: number): Economics {
  const crop = getCrop(farm.cropId);
  const outlook = harvestOutlook(crop, farm.plantedYear, farm.plantedOn);
  const yieldQtl = outlook.qtlPerAcre * farm.acres;
  const price = referencePrice(farm, market);
  const revenue = Math.round(yieldQtl * price);
  const trend = Object.values(market?.weekChangePct ?? {})[0] ?? 0;

  return {
    expectedYieldQtl: Math.round(yieldQtl * 10) / 10,
    expectedRevenue: revenue,
    totalCosts: costs,
    expectedProfit: revenue - costs,
    weekDeltaRupees: Math.round((revenue * trend) / 100),
    // A generic crop has no yield curve; a crop with no quotes has no price; a
    // crop just put in the ground has no harvest yet. In every one of those
    // cases we report costs and stay silent on profit, rather than presenting a
    // number the farmer would reasonably read as money he is owed.
    yieldKnown: crop.yield.kind === "seasonal" ? crop.yield.qtlPerAcre > 0 : true,
    priceKnown: price > 0,
    bearing: outlook.bearing,
    firstHarvestOn: outlook.firstHarvestOn,
  };
}
