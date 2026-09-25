"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession } from "./session";
import { t as translate, type Lang } from "./i18n";

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

  // The type scale tracks tightly, which suits Jakarta and closes up the Indic
  // faces — they have no capitals and hang taller, so the headline steps need
  // their spacing back. globals.css keys that off the root, so tell it which
  // kind of script is on screen. Written from here because this hook is the
  // one place that knows the language; the write is idempotent, which is why
  // several components calling it at once is harmless.
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-script",
      lang === "en" ? "latin" : "indic",
    );
  }, [lang]);

  return { lang, t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params) };
}
