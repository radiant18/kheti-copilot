"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadSession } from "@/lib/session";

const PUBLIC_ROUTES = new Set(["/login"]);

/** Screens that only make sense with a farm behind them. */
const FARMER_ONLY = new Set(["/", "/onboarding", "/profit", "/ask", "/market"]);

/**
 * Sends a signed-out visitor to /login, and a signed-in one who never finished
 * setup to /onboarding.
 *
 * The check runs client-side because the session lives in localStorage — see
 * lib/session.ts, this is not real auth and must not be treated as a security
 * boundary. When the backend lands, move this to middleware reading a cookie.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = loadSession();

    if (!session && !PUBLIC_ROUTES.has(path)) {
      router.replace("/login");
      return;
    }
    if (session && !session.onboarded && path !== "/onboarding" && !PUBLIC_ROUTES.has(path)) {
      router.replace("/onboarding");
      return;
    }

    // A buyer has no farm, so the farm screens have nothing to show them —
    // Today would render irrigation advice for a garden that does not exist.
    if (session?.role === "buyer" && FARMER_ONLY.has(path)) {
      router.replace("/market/direct");
      return;
    }
    setReady(true);
  }, [path, router]);

  // Render nothing rather than a flash of the wrong screen mid-redirect.
  if (!ready) return null;
  return <>{children}</>;
}
