import type { ArecaGrade } from "./types";

/**
 * Agmarknet publishes arecanut under free-text variety names that vary by
 * mandi and by clerk. This map is the normalisation layer — it is the single
 * place to fix when a new spelling shows up in the feed.
 */
export const GRADE_ALIASES: Record<string, ArecaGrade> = {
  rashi: "rashi",
  raashi: "rashi",
  "rashi idi": "rashi",
  "hosa chali": "hosa_chali",
  hosachali: "hosa_chali",
  "new variety": "hosa_chali",
  "hale chali": "hale_chali",
  halechali: "hale_chali",
  "old variety": "hale_chali",
  chippu: "chippu",
  bilegotu: "bilegotu",
  "bile gotu": "bilegotu",
  cqca: "cqca",
  "c q c a": "cqca",
};

export const GRADE_LABEL: Record<ArecaGrade, { en: string; kn: string }> = {
  rashi: { en: "Rashi", kn: "ರಾಶಿ" },
  hosa_chali: { en: "Hosa Chali", kn: "ಹೊಸ ಚಾಲಿ" },
  hale_chali: { en: "Hale Chali", kn: "ಹಳೆ ಚಾಲಿ" },
  chippu: { en: "Chippu", kn: "ಚಿಪ್ಪು" },
  bilegotu: { en: "Bilegotu", kn: "ಬಿಳೆಗೋಟು" },
  cqca: { en: "CQCA", kn: "ಸಿಕ್ಯುಸಿಎ" },
};

export function normaliseGrade(raw: string): ArecaGrade | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return GRADE_ALIASES[key] ?? null;
}
