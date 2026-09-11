"use client";

/**
 * Light, dark, or whatever the phone says.
 *
 * The stylesheet already handles all three: bare :root is light, the
 * prefers-color-scheme block is guarded so an explicit light choice beats a
 * dark phone, and :root[data-theme="dark"] lets the choice win the other way.
 * All this does is stamp the attribute.
 *
 * "system" is the default rather than light, because a farmer who has already
 * set their phone to dark has told us something, and a fixed default would
 * override it.
 */

export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "kheti.theme.v1";

export function loadTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return raw === "light" || raw === "dark" ? raw : "system";
  } catch {
    return "system";
  }
}

/** Stamping the root is what the stylesheet reads; "system" clears it. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode — the choice lasts this session only.
  }
  applyTheme(theme);
}
