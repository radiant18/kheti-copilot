"use client";

import { useEffect, useState } from "react";
import { addCost, loadCosts, loadFarm } from "@/lib/farm";
import { economics } from "@/lib/engine/market";
import { harvestNote } from "@/components/HarvestNote";
import { apiGet } from "@/lib/api";
import type { CostEntry, Economics, MarketView } from "@/lib/types";

const CATEGORIES: CostEntry["category"][] = [
  "fertilizer",
  "labour",
  "pesticide",
  "irrigation",
  "transport",
  "other",
];

/**
 * The cost book. Deliberately a two-field form — an amount and a category —
 * because anything longer does not get filled in at the end of a working day.
 */
export default function ProfitPage() {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [econ, setEcon] = useState<Economics | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CostEntry["category"]>("labour");

  useEffect(() => {
    const c = loadCosts();
    setCosts(c);
    const farm = loadFarm();
    apiGet<MarketView>("/api/market", { crop: farm.cropId, state: farm.state })
      .then((m) => setEcon(economics(farm, m, c.reduce((s, e) => s + e.amount, 0))))
      .catch(() => setEcon(economics(farm, null, c.reduce((s, e) => s + e.amount, 0))));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    const next = addCost({
      farmId: loadFarm().id,
      date: new Date().toISOString().slice(0, 10),
      category,
      amount: value,
    });
    setCosts(next);
    setAmount("");
    const farm = loadFarm();
    setEcon(economics(farm, null, next.reduce((s, x) => s + x.amount, 0)));
  }

  return (
    <main className="py-5">
      <h1 className="text-2xl font-bold tracking-tight">Farm profit</h1>

      {econ && (
        <section
          className="mt-4 rounded-2xl border p-4"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          {econ.bearing && econ.yieldKnown && econ.priceKnown ? (
            <>
              <Row label="Expected yield" value={`${econ.expectedYieldQtl} qtl`} />
              <Row label="Expected revenue" value={`₹${econ.expectedRevenue.toLocaleString("en-IN")}`} />
              <Row label="Costs so far" value={`−₹${econ.totalCosts.toLocaleString("en-IN")}`} />
              <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--line)" }}>
                <Row
                  label="Expected profit"
                  value={`₹${econ.expectedProfit.toLocaleString("en-IN")}`}
                  strong
                />
              </div>
            </>
          ) : (
            <>
              <Row label="Costs so far" value={`₹${econ.totalCosts.toLocaleString("en-IN")}`} strong />
              <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
                {harvestNote(econ)} Your costs are still tracked.
              </p>
            </>
          )}
        </section>
      )}

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount ₹"
          className="min-w-0 flex-1 rounded-xl border px-3 text-base"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CostEntry["category"])}
          className="rounded-xl border px-2 text-base"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl px-4 font-semibold"
          style={{ background: "var(--accent)", color: "var(--ground)" }}
        >
          Add
        </button>
      </form>

      <ul className="mt-4 space-y-2">
        {[...costs].reverse().map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <span>
              <span className="font-medium capitalize">{c.category}</span>
              {c.note && <span style={{ color: "var(--ink-soft)" }}> · {c.note}</span>}
            </span>
            <span className="tabular-nums font-semibold">₹{c.amount.toLocaleString("en-IN")}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className={strong ? "font-semibold" : ""} style={{ color: strong ? undefined : "var(--ink-soft)" }}>
        {label}
      </span>
      <span
        className={`tabular-nums ${strong ? "text-xl font-bold" : "font-medium"}`}
        style={strong ? { color: "var(--money)" } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
