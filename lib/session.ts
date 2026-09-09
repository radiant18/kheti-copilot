"use client";

/**
 * Local sign-in state.
 *
 * IMPORTANT: this is NOT authentication. It records a phone number on the
 * device so the app knows whose farm to load and can skip onboarding on the
 * next open. There is no server, no OTP, and no verification — anyone with the
 * phone can open the app.
 *
 * The real thing, when there is a backend: send an OTP over SMS, verify it
 * server-side, and exchange it for a session token stored in an httpOnly
 * cookie on web and in secure storage on mobile. Until then, do not put
 * anything sensitive behind this.
 */

const SESSION_KEY = "kheti.session.v1";

import type { Lang } from "./i18n";

export interface Session {
  phone: string;
  name: string;
  /** Chosen at sign-in, before a farm exists, so the setup flow is translated too. */
  lang: Lang;
  signedInAt: string;
  /** False until the farm profile wizard has been completed. */
  onboarded: boolean;
  /**
   * True for the look-around session started from the login screen. The app
   * badges it and offers a way out, so nobody mistakes the seeded arecanut
   * garden for a farm they entered themselves.
   */
  demo?: boolean;
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Private mode — the session lasts this tab only, which still works.
  }
}

export function signIn(phone: string, name: string, lang: Lang): Session {
  const existing = loadSession();
  const session: Session = {
    phone,
    name,
    lang,
    signedInAt: new Date().toISOString(),
    onboarded: existing?.phone === phone ? existing.onboarded : false,
  };
  saveSession(session);
  return session;
}

/**
 * Start a look-around session on the seeded demo garden.
 *
 * Someone opening this app for the first time — a judge, a farmer's son, an
 * extension officer — should see what it does before being asked for a phone
 * number. Nothing here is verified and nothing is sent anywhere; it is the same
 * local session as any other, flagged so it can be left cleanly.
 */
export function startDemo(lang: Lang): Session {
  const session: Session = {
    phone: "",
    name: "Suresh Bhat",
    lang,
    signedInAt: new Date().toISOString(),
    onboarded: true,
    demo: true,
  };
  saveSession(session);
  return session;
}

export function isDemo(): boolean {
  return loadSession()?.demo === true;
}

export function markOnboarded(): void {
  const session = loadSession();
  if (session) saveSession({ ...session, onboarded: true });
}

export function signOut(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clear */
  }
}

export { isValidPhone } from "./session-shared";
