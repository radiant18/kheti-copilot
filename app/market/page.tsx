"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { getCrop, gradeLabel } from "@/lib/crops";
import { loadFarm, saveFarm } from "@/lib/farm";
import { rankSellOptions } from "@/lib/engine/market";
import { withTrend } from "@/lib/price-history";
import { PageHeader } from "@/components/PageHeader";
import { YardBar } from "@/components/YardBar";
import type { Farm, Grade, MarketView } from "@/lib/types";

/**
 * The sell screen answers one question: for the stock I am holding, which yard
 * pays me the most after I have paid the lorry?
 *
 * Stock is captured here rather than in onboarding because it changes weekly —
 * it belongs next to the prices it is valued against, not in a setup wizard.
 */
export default function MarketPage() {
  const [market, setMarket] = useState<MarketView | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const f = loadFarm();
    setFarm(f);
    apiGet<MarketView>("/api/market", { crop: f.cropId, state: f.state })
      .then((m) => setMarket(withTrend(m)))
      .catch(() => setMarket(null));
  }, []);

  const crop = farm ? getCrop(farm.cropId) : null;

  /** Grades actually quoted today, so the farmer can only claim real ones. */
  const availableGrades = useMemo(() => {
    if (!market) return [];
    return [...new Set(market.quotes.map((q) => q.grade))];
  }, [market]);

  const heldGrades = useMemo(
    () => (farm ? Object.keys(farm.stockQtl).filter((g) => farm.stockQtl[g] > 0) : []),
    [farm],
  );

  useEffect(() => {
    if (grade === null && heldGrades.length > 0) setGrade(heldGrades[0]);
    else if (grade === null && availableGrades.length > 0) setGrade(availableGrades[0]);
  }, [grade, heldGrades, availableGrades]);

  const quintals = farm && grade ? farm.stockQtl[grade] || 1 : 1;
  const options = useMemo(
    () => (farm && market && grade ? rankSellOptions(farm, market, grade, quintals) : []),
    [farm, market, grade, quintals],
  );

  function setStock(g: Grade, qtl: number) {
    setFarm((f) => {
      if (!f) return f;
      const stockQtl = { ...f.stockQtl };
      if (qtl > 0) stockQtl[g] = qtl;
      else delete stockQtl[g];
      const next = { ...f, stockQtl };
      saveFarm(next);
      return next;
    });
  }

  if (!farm || !crop) return null;

  return (
    <main className="py-5">
      <PageHeader
        title="Where to sell"
        subtitle={`${crop.name.en} prices across ${farm.state}, with your transport netted out.`}
      />

      {market?.source !== "live" && market && market.quotes.length > 0 && (
        <p
          className="mt-3 rounded-xl border px-3 py-2 text-xs"
          style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
        >
          Sample prices from 7 Sep 2026, not today's board. Set DATA_GOV_API_KEY for the live Agmarknet feed.
        </p>
      )}

      {market && market.quotes.length === 0 && (
        <p
          className="mt-4 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
        >
          {market.source === "unconfigured" ? (
            <>
              <strong className="block text-base">Market prices are not switched on</strong>
              <span className="mt-1 block">
                Prices come from Agmarknet, the government&apos;s daily mandi board. It is
                free, but it needs a key. This takes about two minutes and only has to be
                done once.
              </span>
              <ol className="mt-3 list-decimal space-y-1 pl-5">
                <li>
                  Open <strong>data.gov.in</strong> and sign in (registering is free).
                </li>
                <li>
                  Go to <strong>My Account → API key</strong> and copy it.
                </li>
                <li>
                  Put it in <code>.env.local</code> as{" "}
                  <code>DATA_GOV_API_KEY=your_key</code> and restart the app.
                </li>
              </ol>
              <span className="mt-3 block">
                Until then, no crop will show prices — the arecanut figures elsewhere in the
                app are a bundled sample from 7 September, not today&apos;s board.
              </span>
            </>
          ) : (
            <>
              No {crop.name.en.toLowerCase()} quotes for {farm.state} today. Some yards
              report late in the day, and not every commodity trades in every state. Check
              back this evening.
            </>
          )}
        </p>
      )}

      {availableGrades.length > 0 && (
        <section className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
              Your stock
            </h2>
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-sm font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {editing ? "Done" : "Edit"}
            </button>
          </div>

          {editing ? (
            <ul className="space-y-2">
              {availableGrades.map((g) => (
                <li
                  key={g}
                  className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                  style={{ borderColor: "var(--line)", background: "var(--surface)" }}
                >
                  <span className="font-medium">{gradeLabel(crop, g)}</span>
                  <span className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      value={farm.stockQtl[g] ?? ""}
                      onChange={(e) => setStock(g, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 rounded-lg border px-2 text-right text-base tabular-nums"
                      style={{ borderColor: "var(--line)", background: "var(--ground)", color: "var(--ink)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--ink-soft)" }}>qtl</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : heldGrades.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {heldGrades.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className="rounded-full border px-3 py-1.5 text-sm font-medium"
                  style={{
                    borderColor: g === grade ? "var(--accent)" : "var(--line)",
                    background: g === grade ? "var(--accent-soft)" : "var(--surface)",
                    color: g === grade ? "var(--accent)" : "var(--ink-soft)",
                  }}
                >
                  {gradeLabel(crop, g)} · {farm.stockQtl[g]} qtl
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              Tap Edit and enter how many quintals you are holding, and this becomes a
              selling recommendation instead of a price list.
            </p>
          )}
        </section>
      )}

      {options.length > 0 && (
        <ol className="mt-5 space-y-3">
          {options.map((o, i) => (
            <YardBar
              key={`${o.quote.market}-${o.quote.grade}`}
              option={o}
              best={options[0].net}
              floor={options[options.length - 1].net * 0.9}
              rank={i}
              gapLabel={
                i === 0 && options[1]
                  ? `₹${(o.net - options[1].net).toLocaleString("en-IN")} better than the next yard`
                  : undefined
              }
            />
          ))}
        </ol>
      )}
    </main>
  );
}
