"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { apiGet } from "@/lib/api";
import { economics } from "@/lib/engine/market";
import { addCost, loadCosts, loadFarm } from "@/lib/farm";
import type { CostEntry, Economics, MarketView } from "@/lib/types";
import { useLang } from "@/lib/use-lang";

const CATEGORIES: { id: CostEntry["category"]; icon: string; label: string }[] = [
  { id: "labour", icon: "👷", label: "Labour" },
  { id: "fertilizer", icon: "🌱", label: "Fertiliser" },
  { id: "pesticide", icon: "🧪", label: "Spray" },
  { id: "irrigation", icon: "💧", label: "Water" },
  { id: "seed", icon: "🌾", label: "Seed" },
  { id: "transport", icon: "🚚", label: "Transport" },
  { id: "other", icon: "📦", label: "Other" },
];

/**
 * The cost book and what it implies.
 *
 * Entry is two taps and a number — a category chip and an amount. Anything
 * longer does not get filled in at the end of a working day, and a cost book
 * with gaps produces a profit figure worse than no profit figure at all.
 */
export default function ProfitPage() {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [econ, setEcon] = useState<Economics | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CostEntry["category"]>("labour");
  // Held so recalculating after an expense does not throw the prices away.
  const [market, setMarket] = useState<MarketView | null>(null);
  const { t } = useLang();

  useEffect(() => {
    const c = loadCosts();
    setCosts(c);
    const farm = loadFarm();
    const total = c.reduce((s, e) => s + e.amount, 0);
    apiGet<MarketView>("/api/market", { crop: farm.cropId, state: farm.state })
      .then((m) => {
        setMarket(m);
        setEcon(economics(farm, m, total));
      })
      .catch(() => setEcon(economics(farm, null, total)));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const farm = loadFarm();
    const next = addCost({
      farmId: farm.id,
      date: new Date().toISOString().slice(0, 10),
      category,
      amount: value,
    });
    setCosts(next);
    setAmount("");
    setEcon(economics(farm, market, next.reduce((s, x) => s + x.amount, 0)));
  }

  const total = costs.reduce((s, c) => s + c.amount, 0);
  const byCategory = CATEGORIES.map((c) => ({
    ...c,
    amount: costs.filter((x) => x.category === c.id).reduce((s, x) => s + x.amount, 0),
  })).filter((c) => c.amount > 0);

  const valued = econ?.bearing && econ.yieldKnown && econ.priceKnown;

  return (
    <main className="py-5">
      <PageHeader title={t("navProfit")} />

      {econ && (
        <section className="card p-5">
          {valued ? (
            <>
              <p className="eyebrow">{t("expectedProfit")}</p>
              <p
                className="tabular mt-1.5 text-[2.1rem] font-extrabold leading-none"
                style={{ color: "var(--money)" }}
              >
                ₹{econ.expectedProfit.toLocaleString("en-IN")}
              </p>

              {/* Revenue against costs, to scale — the ratio is the story. */}
              <div
                aria-hidden
                className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.round((econ.totalCosts / Math.max(1, econ.expectedRevenue)) * 100))}%`,
                    background: "var(--signal)",
                  }}
                />
              </div>

              <dl className="mt-4 space-y-2">
                <Row label="Expected revenue" value={`₹${econ.expectedRevenue.toLocaleString("en-IN")}`} />
                <Row label="Spent so far" value={`−₹${econ.totalCosts.toLocaleString("en-IN")}`} />
                <Row label="Expected yield" value={`${econ.expectedYieldQtl} qtl`} muted />
              </dl>
            </>
          ) : (
            <>
              <p className="eyebrow">{t("spentThisSeason")}</p>
              <p className="tabular mt-1.5 text-[2.1rem] font-extrabold leading-none">
                ₹{total.toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {!econ.bearing
                  ? `Your crop is still growing, so there is nothing to value yet. First harvest around ${econ.firstHarvestOn ?? "—"}.`
                  : !econ.priceKnown
                    ? "No mandi price for this crop today, so the harvest cannot be valued yet."
                    : "No harvest estimate exists for this crop yet."}
              </p>
            </>
          )}
        </section>
      )}

      {byCategory.length > 0 && (
        <section className="mt-5">
          <h2 className="eyebrow mb-2">Where it went</h2>
          <ul className="space-y-2">
            {byCategory.map((c) => (
              <li key={c.id} className="card flex items-center gap-3 px-3.5 py-2.5">
                <span aria-hidden className="text-[17px]">{c.icon}</span>
                <span className="flex-1">
                  <span className="text-[14px] font-semibold">{c.label}</span>
                  <span
                    aria-hidden
                    className="mt-1 block h-1.5 overflow-hidden rounded-full"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.round((c.amount / total) * 100)}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </span>
                </span>
                <span className="tabular text-[14px] font-bold">
                  ₹{c.amount.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="eyebrow mb-2">Add an expense</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = c.id === category;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                aria-pressed={on}
                className="press rounded-full border px-3 py-2 text-[13px]"
                style={{
                  borderColor: on ? "var(--accent)" : "var(--line)",
                  background: on ? "var(--accent-soft)" : "var(--surface)",
                  color: on ? "var(--accent)" : "var(--ink-soft)",
                  fontWeight: on ? 700 : 500,
                }}
              >
                <span aria-hidden>{c.icon}</span> {c.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={submit} className="flex gap-2">
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹ 0"
            className="card tabular min-w-0 flex-1 px-3.5 py-3"
            style={{ color: "var(--ink)" }}
          />
          <button
            type="submit"
            disabled={!amount.trim()}
            className="press rounded-xl px-5 font-bold"
            style={{
              background: amount.trim() ? "var(--accent)" : "var(--surface-2)",
              color: amount.trim() ? "var(--ground)" : "var(--ink-faint)",
            }}
          >
            Add
          </button>
        </form>
      </section>

      {costs.length > 0 && (
        <section className="mt-6">
          <h2 className="eyebrow mb-2">Recent</h2>
          <ul className="space-y-2">
            {[...costs].reverse().slice(0, 8).map((c) => (
              <li key={c.id} className="card flex items-center justify-between px-3.5 py-2.5 text-[14px]">
                <span>
                  <span className="font-semibold capitalize">{c.category}</span>
                  {c.note && <span style={{ color: "var(--ink-faint)" }}> · {c.note}</span>}
                </span>
                <span className="tabular font-bold">₹{c.amount.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {costs.length === 0 && (
        <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
          Nothing recorded yet. Add what you spend as you spend it — the profit figure is
          only as honest as this list.
        </p>
      )}
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[14px]" style={{ color: "var(--ink-soft)" }}>{label}</dt>
      <dd
        className="tabular text-[14px] font-semibold"
        style={muted ? { color: "var(--ink-soft)" } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
