"use client";

import type { ArecaGrade, MarketView } from "./types";

/**
 * Rolling price memory.
 *
 * Agmarknet's API only ever returns today's board — there is no "vs last week"
 * field. Rather than invent a trend, the app records the state modal price each
 * day it runs and compares against the oldest snapshot inside the window. That
 * means a fresh install shows no trend for a few days, which is the honest
 * answer. Server-side history is the obvious upgrade once there is a backend.
 */

const KEY = "kheti.prices.v1";
const WINDOW_DAYS = 10;

type Snapshot = { date: string; modal: Partial<Record<ArecaGrade, number>> };

function read(): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Snapshot[];
  } catch {
    return [];
  }
}

export function recordPrices(modal: Partial<Record<ArecaGrade, number>>): Snapshot[] {
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const kept = read().filter((s) => s.date > cutoff && s.date !== today);
  const next = [...kept, { date: today, modal }];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota — trends are a bonus, not a requirement */
  }
  return next;
}

/** Percent change per grade against the oldest snapshot we hold. */
export function weekChange(history: Snapshot[]): Partial<Record<ArecaGrade, number>> {
  if (history.length < 2) return {};
  const oldest = history[0];
  const latest = history[history.length - 1];
  const out: Partial<Record<ArecaGrade, number>> = {};
  for (const [grade, now] of Object.entries(latest.modal) as [ArecaGrade, number][]) {
    const then = oldest.modal[grade];
    if (!then || !now) continue;
    out[grade] = Math.round(((now - then) / then) * 1000) / 10;
  }
  return out;
}

/** Fold locally-observed history into a freshly fetched market view. */
export function withTrend(market: MarketView): MarketView {
  const history = recordPrices(market.stateModal);
  return { ...market, weekChangePct: weekChange(history) };
}
