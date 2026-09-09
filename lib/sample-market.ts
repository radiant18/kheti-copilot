import type { MandiQuote } from "./types";

/**
 * Fallback price boards, one per crop.
 *
 * Used only when the Agmarknet feed is unreachable or unkeyed. Every response
 * built from these is tagged `sample` and the Sell screen says so on the page —
 * a farmer must never mistake an illustration for today's board.
 *
 * The arecanut set is real: those are the modal prices Karnataka yards actually
 * posted on 7 September 2026, and they are the clearest argument for the whole
 * product — Rashi cleared ₹50,899/qtl at Yellapur the same day CQCA cleared
 * ₹27,000 at Sullia. The rest are plausible boards for the same date, built to
 * the right order of magnitude and the right shape of spread so the app can be
 * shown working on any crop without a key. They are illustrations, not records.
 *
 * Markets are limited to the gazetteer in lib/engine/market.ts so transport
 * netting works; an unplaced yard would silently lose its distance.
 */

const D = "2026-09-07";

/** Terser than repeating the field names 90 times. */
function q(
  market: string,
  district: string,
  grade: string,
  modal: number,
  min: number,
  max: number,
): MandiQuote {
  return {
    market,
    district,
    grade,
    modalPerQtl: modal,
    minPerQtl: min,
    maxPerQtl: max,
    date: D,
  };
}

/** Real board, 7 September 2026. */
export const SAMPLE_ARECANUT_QUOTES: MandiQuote[] = [
  q("Yellapur", "Uttara Kannada", "rashi", 50899, 47999, 53329),
  q("Holalkere", "Chitradurga", "rashi", 50891, 47299, 51499),
  q("Kumta", "Uttara Kannada", "hale_chali", 47529, 46099, 48899),
  q("Kumta", "Uttara Kannada", "hosa_chali", 42639, 36699, 44309),
  q("Puttur", "Dakshina Kannada", "hosa_chali", 45000, 30000, 47500),
  q("Sirsi", "Uttara Kannada", "hosa_chali", 43880, 39100, 46200),
  q("Kumta", "Uttara Kannada", "chippu", 30689, 26089, 31099),
  q("Yellapur", "Uttara Kannada", "bilegotu", 29615, 17299, 31412),
  q("Kumta", "Uttara Kannada", "cqca", 28679, 17089, 31009),
  q("Sullia", "Dakshina Kannada", "cqca", 27000, 20000, 34000),
];

/**
 * Illustrative boards for the remaining crops. Spreads are deliberately real in
 * character — the vegetable crops swing hard between yards, the plantation
 * crops much less — because that spread is the thing the sell engine exists to
 * exploit, and a flat board would demonstrate nothing.
 */
const OTHER_SAMPLES: Record<string, MandiQuote[]> = {
  coconut: [
    q("Tiptur", "Tumakuru", "grade_i", 4180, 3600, 4500),
    q("Arasikere", "Hassan", "grade_i", 3950, 3400, 4200),
    q("Mangaluru", "Dakshina Kannada", "grade_i", 3620, 3100, 3900),
    q("Bantwal", "Dakshina Kannada", "other", 2890, 2400, 3200),
  ],
  black_pepper: [
    q("Sirsi", "Uttara Kannada", "ungarbled", 64500, 61000, 67200),
    q("Sakleshpur", "Hassan", "ungarbled", 66800, 63500, 69000),
    q("Madikeri", "Kodagu", "garbled", 69200, 66000, 71500),
    q("Mangaluru", "Dakshina Kannada", "ungarbled", 62300, 58000, 65000),
  ],
  cocoa: [
    q("Puttur", "Dakshina Kannada", "dry", 31500, 28000, 33500),
    q("Mangaluru", "Dakshina Kannada", "dry", 30200, 27500, 32000),
    q("Sakleshpur", "Hassan", "wet", 9800, 8500, 10600),
  ],
  cardamom: [
    q("Madikeri", "Kodagu", "bold", 246000, 228000, 262000),
    q("Sakleshpur", "Hassan", "bold", 238500, 219000, 251000),
    q("Chikkamagaluru", "Chikkamagaluru", "medium", 198000, 182000, 210000),
  ],
  paddy: [
    q("Davangere", "Davanagere", "common", 2310, 2150, 2480),
    q("Shivamogga", "Shivamogga", "common", 2265, 2100, 2400),
    q("Raichur", "Raichur", "fine", 2680, 2450, 2850),
    q("Mandya", "Mandya", "common", 2190, 2020, 2350),
    q("Bhadravati", "Shivamogga", "fine", 2590, 2380, 2740),
  ],
  tomato: [
    q("Kolar", "Kolar", "local", 1840, 900, 2400),
    q("Chikkaballapur", "Chikkaballapur", "local", 1620, 800, 2150),
    q("Bengaluru", "Bengaluru", "hybrid", 2180, 1400, 2800),
    q("Mysuru", "Mysuru", "local", 1290, 700, 1800),
    q("Hubballi", "Dharwad", "local", 1450, 850, 2000),
  ],
  banana: [
    q("Bengaluru", "Bengaluru", "yelakki", 4250, 3600, 4800),
    q("Mysuru", "Mysuru", "yelakki", 3980, 3400, 4400),
    q("Davangere", "Davanagere", "robusta", 1820, 1500, 2100),
    q("Chamarajanagar", "Chamarajanagar", "robusta", 1650, 1350, 1950),
    q("Hubballi", "Dharwad", "robusta", 1740, 1400, 2050),
  ],
  onion: [
    q("Hubballi", "Dharwad", "local", 1620, 900, 2200),
    q("Bengaluru", "Bengaluru", "local", 1880, 1100, 2450),
    q("Belagavi", "Belagavi", "local", 1410, 800, 1900),
    q("Chitradurga", "Chitradurga", "red", 1520, 850, 2050),
  ],
  potato: [
    q("Hassan", "Hassan", "local", 1980, 1600, 2350),
    q("Bengaluru", "Bengaluru", "local", 2240, 1800, 2650),
    q("Chikkaballapur", "Chikkaballapur", "local", 1870, 1500, 2200),
  ],
  green_chilli: [
    q("Hubballi", "Dharwad", "local", 3850, 2600, 5100),
    q("Davangere", "Davanagere", "local", 3420, 2300, 4600),
    q("Bengaluru", "Bengaluru", "hybrid", 4600, 3200, 5800),
  ],
  ragi: [
    q("Tumakuru", "Tumakuru", "local", 3280, 3050, 3480),
    q("Mandya", "Mandya", "local", 3190, 2980, 3390),
    q("Bengaluru", "Bengaluru", "local", 3410, 3150, 3620),
  ],
  maize: [
    q("Davangere", "Davanagere", "local", 2240, 2080, 2390),
    q("Ballari", "Ballari", "local", 2185, 2020, 2320),
    q("Haveri", "Haveri", "hybrid", 2310, 2150, 2450),
  ],
  groundnut: [
    q("Chitradurga", "Chitradurga", "local", 6580, 5900, 7150),
    q("Ballari", "Ballari", "local", 6320, 5700, 6900),
    q("Tumakuru", "Tumakuru", "bold", 7040, 6400, 7600),
  ],
  turmeric: [
    q("Chamarajanagar", "Chamarajanagar", "finger", 15800, 13500, 17600),
    q("Bagalkote", "Bagalkote", "finger", 14600, 12800, 16200),
  ],
  ginger: [
    q("Shivamogga", "Shivamogga", "green", 11400, 8600, 14200),
    q("Hassan", "Hassan", "green", 10800, 8200, 13500),
    q("Madikeri", "Kodagu", "green", 12600, 9800, 15400),
  ],
  cotton: [
    q("Ballari", "Ballari", "local", 7680, 7100, 8150),
    q("Raichur", "Raichur", "local", 7520, 6950, 7980),
    q("Haveri", "Haveri", "local", 7410, 6800, 7860),
  ],
  sugarcane: [
    q("Mandya", "Mandya", "local", 340, 300, 375),
    q("Belagavi", "Belagavi", "local", 328, 290, 360),
    q("Bagalkote", "Bagalkote", "local", 335, 295, 368),
  ],
};

/** Fallback board for a crop, or an empty array when we have nothing honest. */
export function sampleQuotesFor(cropId: string): MandiQuote[] {
  if (cropId === "arecanut") return SAMPLE_ARECANUT_QUOTES;
  return OTHER_SAMPLES[cropId] ?? [];
}

/** True only for the arecanut board, which is a real record rather than a sketch. */
export function isRealBoard(cropId: string): boolean {
  return cropId === "arecanut";
}
