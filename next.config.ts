import type { NextConfig } from "next";

/**
 * One codebase, two build targets.
 *
 *   next build                  → the web app on Vercel, API routes included.
 *   MOBILE_BUILD=1 next build   → a static bundle in ./out for Capacitor to
 *                                 wrap as the Android and iOS apps.
 *
 * The mobile bundle has no server, so it talks to the deployed API instead —
 * see NEXT_PUBLIC_API_BASE in lib/api.ts. Keeping every network call behind
 * that one helper is what lets the same screens ship to all three platforms.
 */
const isMobile = process.env.MOBILE_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isMobile ? { output: "export", images: { unoptimized: true } } : {}),
};

export default nextConfig;
