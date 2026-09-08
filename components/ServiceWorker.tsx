"use client";

import { useEffect } from "react";

/**
 * Registers the offline shell.
 *
 * Production only, deliberately. A service worker in development serves stale
 * chunks after every edit, which is exactly the "I removed that label but still
 * see it" confusion we already spent time chasing once.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // No offline shell; the app still works online.
      });
    };

    // Wait for load so registration never competes with the first paint.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
