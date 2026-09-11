"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { ActionCard } from "@/components/ActionCard";
import { CropIcon } from "@/components/CropIcon";
import { RainOutlook } from "@/components/RainOutlook";
import { harvestNote } from "@/components/HarvestNote";
import { cropName, getCrop } from "@/lib/crops";
import { farmSizeLabel } from "@/lib/crops/planting";
import { nextSprayWindow } from "@/lib/engine/pressure";
import { loadFarm, loadFarms } from "@/lib/farm";
import { isDemo, signOut } from "@/lib/session";
import { useLang } from "@/lib/use-lang";
import { usePlan } from "@/lib/use-plan";
import type { Farm } from "@/lib/types";

/**
 * The morning screen.
 *
 * Restructured around what a farmer opens it for: the one thing to do today,
 * not a season total. Expected profit used to be the hero, but it barely moves
 * day to day — leading with it made every morning look identical and buried the
 * decision underneath. It now sits at the foot as a line, linking to the screen
 * that is actually about money.
 *
 * Order: the lead action in full, the rest compact, then when it will rain.
 */
export default function TodayPage() {
  const { plan, stale, loading, refresh } = usePlan();
  const { lang, t } = useLang();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [plotCount, setPlotCount] = useState(1);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    setFarm(loadFarm());
    setPlotCount(loadFarms().length);
    setDemo(isDemo());
  }, []);

  const crop = farm ? getCrop(farm.cropId) : null;

  /** Drawn on the rain grid so the window is visible, not just described. */
  const spray = useMemo(() => {
    if (!plan || !crop || crop.diseases.length === 0) return null;
    return nextSprayWindow(plan.weather, crop.diseases[0].treatment.dryHours);
  }, [plan, crop]);

  const [lead, ...rest] = plan?.recommendations ?? [];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="py-5">
      {demo && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-semibold"
          style={{ background: "var(--signal-soft)", color: "var(--signal)" }}
        >
          <span>{t("demoBadge")}</span>
          <button
            onClick={() => {
              signOut();
              window.location.href = "/login";
            }}
            className="underline underline-offset-2"
          >
            {t("demoExit")}
          </button>
        </div>
      )}

      <header className="mb-5">
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{today}</p>
        <h1 className="mt-0.5 text-[1.75rem] font-extrabold leading-tight">{t("yourFarmToday")}</h1>
        {farm && crop && (
          <p className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: "var(--ink-soft)" }}>
            <CropIcon cropId={farm.cropId} size={22} />
            {cropName(crop, lang)} · {farmSizeLabel(farm, lang)} · {farm.village}
            {plotCount > 1 && (
              <>
                {" · "}
                <Link href="/settings" style={{ color: "var(--accent)" }}>{t("switchCrop")}</Link>
              </>
            )}
          </p>
        )}
      </header>

      {stale && (
        <p className="card mb-4 px-3.5 py-2.5 text-sm" style={{ color: "var(--ink-soft)" }}>
          {t("offlineNote")}
        </p>
      )}

      {loading && !plan && (
        <p className="py-10 text-center" style={{ color: "var(--ink-soft)" }}>{t("loadingPlan")}</p>
      )}

      {/* The single thing worth acting on, given room to say why. */}
      {lead && (
        <section>
          <h2 className="eyebrow mb-2">{t("todayLead")}</h2>
          <ActionCard rec={lead} />
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-6">
          <h2 className="eyebrow mb-2">{t("alsoToday")}</h2>
          <div className="space-y-3">
            {rest.map((rec) => <ActionCard key={rec.id} rec={rec} />)}
          </div>
        </section>
      )}

      {plan && (
        <section className="mt-7">
          <RainOutlook wx={plan.weather} lang={lang} spray={spray} />
        </section>
      )}

      {/* Money belongs on the money screen; here it is a line, not a headline. */}
      {plan && (
        <Link href="/profit" className="press card mt-7 flex items-baseline justify-between gap-3 p-4">
          <span className="text-sm font-semibold" style={{ color: "var(--ink-soft)" }}>
            {plan.economics.bearing && plan.economics.yieldKnown && plan.economics.priceKnown
              ? t("expectedProfit")
              : t("spentThisSeason")}
          </span>
          <span className="tabular text-lg font-extrabold" style={{ color: "var(--money)" }}>
            ₹
            {(plan.economics.bearing && plan.economics.yieldKnown && plan.economics.priceKnown
              ? plan.economics.expectedProfit
              : plan.economics.totalCosts
            ).toLocaleString("en-IN")}
          </span>
        </Link>
      )}

      {plan && !plan.economics.bearing && (
        <p className="mt-2 text-xs" style={{ color: "var(--ink-faint)" }}>
          {harvestNote(plan.economics)}
        </p>
      )}

      <button
        onClick={() => void refresh()}
        className="press card mt-4 w-full py-3 text-sm font-bold"
        style={{ color: "var(--ink-soft)" }}
      >
        {t("refresh")}
      </button>
    </main>
  );
}
