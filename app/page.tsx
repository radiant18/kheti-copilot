"use client";

import Link from "next/link";

import { ActionCard } from "@/components/ActionCard";
import { WeatherStrip } from "@/components/WeatherStrip";
import { cropName, getCrop } from "@/lib/crops";
import { harvestNote } from "@/components/HarvestNote";
import { loadFarm, loadFarms } from "@/lib/farm";
import { t as translate } from "@/lib/i18n";
import { useLang } from "@/lib/use-lang";
import { usePlan } from "@/lib/use-plan";
import { useEffect, useState } from "react";

export default function TodayPage() {
  const { plan, stale, loading, refresh } = usePlan();
  const { lang, t } = useLang();
  const [farmName, setFarmName] = useState("");
  const [plotCount, setPlotCount] = useState(1);

  useEffect(() => {
    const f = loadFarm();
    const unit = translate(lang, f.acres === 1 ? "acre" : "acres");
    setFarmName(`${cropName(getCrop(f.cropId), lang)} · ${f.acres} ${unit} · ${f.village}`);
    setPlotCount(loadFarms().length);
  }, [lang]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="py-5">
      <header className="mb-5">
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{today}</p>
        <h1 className="mt-0.5 text-[1.75rem] font-extrabold leading-tight">{t("yourFarmToday")}</h1>
        {farmName && (
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            {farmName}
            {/* With more than one plot on the phone, say which one this is about. */}
            {plotCount > 1 && (
              <>
                {" · "}
                <Link href="/settings" style={{ color: "var(--accent)" }}>
                  switch crop
                </Link>
              </>
            )}
          </p>
        )}
      </header>

      {stale && (
        <p
          className="card mb-4 px-3.5 py-2.5 text-sm"
          style={{ color: "var(--ink-soft)" }}
        >
          You are offline. These are yesterday&apos;s numbers run through today&apos;s rules.
        </p>
      )}

      {plan && (
        <section
          className="card mb-5 p-5"
        >
          {plan.economics.bearing && plan.economics.yieldKnown && plan.economics.priceKnown ? (
            <>
              <p className="eyebrow">
                {t("expectedProfit")}
              </p>
              <p className="tabular mt-1.5 text-[2.1rem] font-extrabold leading-none" style={{ color: "var(--money)" }}>
                ₹{plan.economics.expectedProfit.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-sm tabular-nums" style={{ color: "var(--ink-soft)" }}>
                {t("qtlExpected", { qtl: plan.economics.expectedYieldQtl })} ·{" "}
                {t("spentSoFar", { amount: plan.economics.totalCosts.toLocaleString("en-IN") })}
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">
                {t("spentThisSeason")}
              </p>
              <p className="tabular mt-1.5 text-[2.1rem] font-extrabold leading-none">
                ₹{plan.economics.totalCosts.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
                {harvestNote(plan.economics)}
              </p>
            </>
          )}
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
          <h2 className="eyebrow mb-2">
            {t("next7days")}
          </h2>
          <WeatherStrip wx={plan.weather} />
        </section>
      )}

      <button
        onClick={() => void refresh()}
        className="press card mt-6 w-full py-3 text-sm font-bold"
        style={{ color: "var(--ink-soft)" }}
      >
        {t("refresh")}
      </button>
    </main>
  );
}
