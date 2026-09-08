"use client";

import type { Grade, MarketView } from "./types";

/**
 * Rolling price memory, kept per crop.
 *
 * Agmarknet's API only ever returns today's board — there is no "vs last week"
 * field. Rather than invent a trend, the app records the state modal price each
 * day it runs and compares against the oldest snapshot in the window. A fresh
 * install therefore shows no trend for a few days, which is the honest answer.
 * Server-side history is the obvious upgrade.
 */

const WINDOW_DAYS = 10;
const keyFor = (cropId: string) => `kheti.prices.v2.${cropId}`;

type Snapshot = { date: string; modal: Record<Grade, number> };

function read(cropId: string): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(keyFor(cropId)) ?? "[]") as Snapshot[];
  } catch {
    return [];
  }
}

export function recordPrices(cropId: string, modal: Record<Grade, number>): Snapshot[] {
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const next = [...read(cropId).filter((s) => s.date > cutoff && s.date !== today), { date: today, modal }];
  try {
    window.localStorage.setItem(keyFor(cropId), JSON.stringify(next));
  } catch {
    // Quota — trends are a bonus, not a requirement.
  }
  return next;
}

export function weekChange(history: Snapshot[]): Record<Grade, number> {
  if (history.length < 2) return {};
  const oldest = history[0];
  const latest = history[history.length - 1];
  const out: Record<Grade, number> = {};
  for (const [grade, now] of Object.entries(latest.modal)) {
    const then = oldest.modal[grade];
    if (!then || !now) continue;
    out[grade] = Math.round(((now - then) / then) * 1000) / 10;
  }
  return out;
}

/** Fold locally-observed history into a freshly fetched market view. */
export function withTrend(market: MarketView): MarketView {
  const cropId = market.cropId ?? "unknown";
  return { ...market, weekChangePct: weekChange(recordPrices(cropId, market.stateModal)) };
}
