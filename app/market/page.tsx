"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { GRADE_LABEL } from "@/lib/grades";
import { loadFarm } from "@/lib/farm";
import { rankSellOptions } from "@/lib/engine/market";
import type { ArecaGrade, Farm, MarketView } from "@/lib/types";

/**
 * The sell screen answers one question: for the stock I am holding, which yard
 * pays me the most after I have paid the lorry?
 */
export default function MarketPage() {
  const [market, setMarket] = useState<MarketView | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [grade, setGrade] = useState<ArecaGrade>("rashi");

  useEffect(() => {
    const f = loadFarm();
    setFarm(f);
    setGrade((Object.keys(f.stockQtl)[0] as ArecaGrade) ?? f.grades[0] ?? "rashi");
    apiGet<MarketView>("/api/market").then(setMarket).catch(() => setMarket(null));
  }, []);

  const quintals = farm?.stockQtl[grade] ?? 1;
  const options = useMemo(
    () => (farm && market ? rankSellOptions(farm, market, grade, quintals) : []),
    [farm, market, grade, quintals],
  );

  const heldGrades = farm ? (Object.keys(farm.stockQtl) as ArecaGrade[]) : [];

  return (
    <main className="py-5">
      <h1 className="text-2xl font-bold tracking-tight">Where to sell</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
        Mandi prices with your transport netted out.
      </p>

      {market?.sample && (
        <p
          className="mt-3 rounded-xl border px-3 py-2 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
        >
          Showing sample prices from 7 Sep 2026 — set DATA_GOV_API_KEY for the live Agmarknet feed.
        </p>
      )}

      {heldGrades.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {heldGrades.map((g) => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className="rounded-full border px-3 py-1.5 text-sm font-medium"
              style={{
                borderColor: g === grade ? "var(--accent)" : "var(--border)",
                background: g === grade ? "var(--accent-soft)" : "var(--surface)",
                color: g === grade ? "var(--accent)" : "var(--ink-soft)",
              }}
            >
              {GRADE_LABEL[g].en} · {farm?.stockQtl[g]} qtl
            </button>
          ))}
        </div>
      )}

      <ol className="mt-4 space-y-3">
        {options.map((o, i) => (
          <li
            key={`${o.quote.market}-${o.quote.grade}`}
            className="rounded-2xl border p-4"
            style={{
              borderColor: i === 0 ? "var(--accent)" : "var(--border)",
              background: i === 0 ? "var(--accent-soft)" : "var(--surface)",
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {i === 0 && <span aria-hidden>⭐ </span>}
                {o.quote.market}
              </h2>
              <span className="text-lg font-bold tabular-nums" style={{ color: "var(--money)" }}>
                ₹{o.net.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--ink-soft)" }}>
              ₹{o.quote.modalPerQtl.toLocaleString("en-IN")}/qtl × {o.quintals} qtl − ₹
              {o.transport.toLocaleString("en-IN")} transport ({o.quote.distanceKm} km)
            </p>
            {i === 0 && options[1] && (
              <p className="mt-2 text-sm font-semibold" style={{ color: "var(--accent)" }}>
                ₹{(o.net - options[1].net).toLocaleString("en-IN")} better than the next yard
              </p>
            )}
          </li>
        ))}
      </ol>

      {options.length === 0 && (
        <p className="py-10 text-center" style={{ color: "var(--ink-soft)" }}>
          No quotes for this grade today.
        </p>
      )}
    </main>
  );
}
