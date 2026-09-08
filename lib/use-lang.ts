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
  return { lang, t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params) };
}
