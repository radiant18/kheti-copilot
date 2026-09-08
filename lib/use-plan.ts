"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./api";
import { buildPlan } from "./engine";
import { loadCosts, loadFarm } from "./farm";
import { loadSession } from "./session";
import { withTrend } from "./price-history";
import type { FarmPlan, MarketView, WeatherWindow } from "./types";

const cacheKeyFor = (cropId: string) => `kheti.plan.v2.${cropId}`;

/**
 * Loads the day's plan.
 *
 * The engine runs on the client against fetched inputs rather than on the
 * server, which means a farmer who opens the app with no signal still gets
 * yesterday's cached weather run through today's rules — degraded, but never
 * blank. `stale` tells the UI to say so plainly.
 */
export function usePlan() {
  const [plan, setPlan] = useState<FarmPlan | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const farm = loadFarm();
    const costs = loadCosts();
    const lang = loadSession()?.lang ?? "en";
    setLoading(true);

    try {
      const [wx, market] = await Promise.all([
        apiGet<WeatherWindow>("/api/weather", { lat: farm.lat, lon: farm.lon }),
        apiGet<MarketView>("/api/market", { crop: farm.cropId, state: farm.state }).catch(() => null),
      ]);
      const enriched = market ? withTrend(market) : null;
      const next = buildPlan(farm, wx, enriched, costs, new Date(), lang);
      setPlan(next);
      setStale(false);
      try {
        window.localStorage.setItem(cacheKeyFor(farm.cropId), JSON.stringify({ wx, market }));
      } catch {
        /* quota — cache is a nicety, not a requirement */
      }
    } catch {
      // Offline: replay the last known inputs through today's rules.
      try {
        const raw = window.localStorage.getItem(cacheKeyFor(farm.cropId));
        if (raw) {
          const { wx, market } = JSON.parse(raw) as { wx: WeatherWindow; market: MarketView | null };
          setPlan(buildPlan(farm, wx, market, costs, new Date(), lang));
          setStale(true);
        }
      } catch {
        setPlan(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { plan, stale, loading, refresh };
}
