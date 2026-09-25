"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession } from "./session";
import { isRtl, localeFor, t as translate, type Lang } from "./i18n";

/**
 * Tell the document root which language is on screen.
 *
 * The type scale tracks tightly, which suits Jakarta and closes up the Indic
 * faces — they have no capitals and hang taller, so the headline steps need
 * their spacing back; globals.css keys that off `data-script`. Urdu reads right
 * to left, so the whole shell mirrors: flex rows reverse, logical margins swap
 * sides, the mic moves to the other corner. `lang` goes with it so the browser
 * shapes and hyphenates with the right rules.
 *
 * Exported because login picks a language before any session exists, so it
 * cannot go through useLang. The writes are idempotent, which is why several
 * components calling this at once is harmless.
 */
export function applyLangToRoot(lang: Lang): void {
  const root = document.documentElement;
  root.setAttribute("data-script", lang === "en" ? "latin" : "indic");
  root.dir = isRtl(lang) ? "rtl" : "ltr";
  root.lang = localeFor(lang);
}

/**
 * The chosen interface language.
 *
 * Read from the session rather than the farm, because it is picked at sign-in
 * before any farm exists, and a grower with plots in two crops still wants one
 * language. Starts at English and corrects on mount — the alternative is
 * rendering nothing until localStorage is read, which flashes an empty screen.
 */
export function useLang(): {
  lang: Lang;
  t: (key: string, params?: Record<string, string | number>) => string;
} {
  const path = usePathname();
  const [lang, setLang] = useState<Lang>("en");

  // Re-read on navigation, not just on mount. The bottom nav mounts while the
  // login screen is still open — before a session exists — so a mount-only read
  // left every tab in English for the whole first session after sign-up.
  useEffect(() => {
    const s = loadSession();
    setLang(s?.lang ?? "en");
  }, [path]);

  useEffect(() => applyLangToRoot(lang), [lang]);

  return { lang, t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params) };
}
