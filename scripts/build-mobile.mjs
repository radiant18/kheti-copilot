#!/usr/bin/env node
/**
 * Builds the static bundle that Capacitor wraps as the Android and iOS apps.
 *
 * The mobile shell has no server, so Next's static export refuses to build the
 * route handlers under app/api. That is correct — the app inside the shell
 * calls the deployed origin instead (see NEXT_PUBLIC_API_BASE in lib/api.ts) —
 * so the fix is to leave the API routes out of this build rather than to make
 * them static.
 *
 * They are moved aside for the duration and restored in a finally block, so an
 * interrupted or failed build cannot leave the working tree without its API.
 */
import { execSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const API = join(root, "app", "api");
const PARKED = join(root, "app", "_api_excluded_from_mobile_build");

if (!process.env.NEXT_PUBLIC_API_BASE) {
  console.warn(
    "\n  WARNING: NEXT_PUBLIC_API_BASE is not set.\n" +
      "  The mobile app has no server of its own, so without this it will call\n" +
      "  capacitor://localhost/api/... and every request will fail.\n" +
      "  Set it to your deployed origin, e.g.\n" +
      "    NEXT_PUBLIC_API_BASE=https://kheti.vercel.app npm run build:mobile\n",
  );
}

if (existsSync(PARKED)) {
  console.error("Found a leftover parked API directory. Restore it before building.");
  process.exit(1);
}

let moved = false;
try {
  if (existsSync(API)) {
    renameSync(API, PARKED);
    moved = true;
  }
  execSync("next build", {
    stdio: "inherit",
    env: { ...process.env, MOBILE_BUILD: "1" },
  });
  console.log("\n  Static bundle written to ./out — run `npx cap sync` next.\n");
} finally {
  if (moved) renameSync(PARKED, API);
}
