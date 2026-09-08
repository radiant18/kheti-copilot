"use client";

import { ActionCard } from "@/components/ActionCard";
import { WeatherStrip } from "@/components/WeatherStrip";
import { loadFarm } from "@/lib/farm";
import { usePlan } from "@/lib/use-plan";
import { useEffect, useState } from "react";

export default function TodayPage() {
  const { plan, stale, loading, refresh } = usePlan();
  const [farmName, setFarmName] = useState("");

  useEffect(() => {
    const f = loadFarm();
    setFarmName(`${f.village}, ${f.acres} acres`);
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="py-5">
      <header className="mb-5">
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{today}</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">Your farm today</h1>
        {farmName && (
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>{farmName}</p>
        )}
      </header>

      {stale && (
        <p
          className="mb-4 rounded-xl border px-3 py-2 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
        >
          You are offline. These are yesterday&apos;s numbers run through today&apos;s rules.
        </p>
      )}

      {plan && (
        <section
          className="mb-5 rounded-2xl border p-4"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
            Expected profit this season
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--money)" }}>
            ₹{plan.economics.expectedProfit.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--ink-soft)" }}>
            {plan.economics.expectedYieldQtl} qtl expected · ₹
            {plan.economics.totalCosts.toLocaleString("en-IN")} spent so far
          </p>
        </section>
      )}

      {loading && !plan && (
        <p className="py-10 text-center" style={{ color: "var(--ink-soft)" }}>
          Reading your weather and mandi prices…
        </p>
      )}

      <div className="space-y-3">
        {plan?.recommendations.map((rec) => <ActionCard key={rec.id} rec={rec} />)}
      </div>

      {plan && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
            Next 7 days
          </h2>
          <WeatherStrip wx={plan.weather} />
        </section>
      )}

      <button
        onClick={() => void refresh()}
        className="mt-6 w-full rounded-xl border px-4 py-3 text-sm font-semibold"
        style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
      >
        Refresh
      </button>
    </main>
  );
}
