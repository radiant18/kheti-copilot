import type { MandiQuote } from "./types";

/**
 * Real Karnataka arecanut quotes observed on 2026-09-07, kept as a fallback so
 * the app degrades to something honest rather than empty when the Agmarknet
 * feed is down or unkeyed. The client badges this as sample data.
 *
 * These numbers are also the clearest argument for the product: on one day,
 * Rashi at Yellapur cleared ₹50,899/qtl while CQCA at Sullia cleared ₹27,000.
 * Same crop, same district belt, nearly double the money.
 */
export const SAMPLE_QUOTES: MandiQuote[] = [
  { market: "Yellapur", district: "Uttara Kannada", grade: "rashi", modalPerQtl: 50899, minPerQtl: 47999, maxPerQtl: 53329, date: "2026-09-07" },
  { market: "Holalkere", district: "Chitradurga", grade: "rashi", modalPerQtl: 50891, minPerQtl: 47299, maxPerQtl: 51499, date: "2026-09-07" },
  { market: "Kumta", district: "Uttara Kannada", grade: "hale_chali", modalPerQtl: 47529, minPerQtl: 46099, maxPerQtl: 48899, date: "2026-09-07" },
  { market: "Kumta", district: "Uttara Kannada", grade: "hosa_chali", modalPerQtl: 42639, minPerQtl: 36699, maxPerQtl: 44309, date: "2026-09-07" },
  { market: "Puttur", district: "Dakshina Kannada", grade: "hosa_chali", modalPerQtl: 45000, minPerQtl: 30000, maxPerQtl: 47500, date: "2026-09-07" },
  { market: "Kumta", district: "Uttara Kannada", grade: "chippu", modalPerQtl: 30689, minPerQtl: 26089, maxPerQtl: 31099, date: "2026-09-07" },
  { market: "Yellapur", district: "Uttara Kannada", grade: "bilegotu", modalPerQtl: 29615, minPerQtl: 17299, maxPerQtl: 31412, date: "2026-09-07" },
  { market: "Kumta", district: "Uttara Kannada", grade: "cqca", modalPerQtl: 28679, minPerQtl: 17089, maxPerQtl: 31009, date: "2026-09-07" },
  { market: "Sullia", district: "Dakshina Kannada", grade: "cqca", modalPerQtl: 27000, minPerQtl: 20000, maxPerQtl: 34000, date: "2026-09-07" },
];
