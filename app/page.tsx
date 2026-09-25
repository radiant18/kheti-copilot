"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { TodayCard } from "@/components/TodayCard";
import { todayCards } from "@/lib/engine/today";
import { CropIcon } from "@/components/CropIcon";
import { RainOutlook } from "@/components/RainOutlook";
import { harvestNote } from "@/components/HarvestNote";
import { cropName, getCrop } from "@/lib/crops";
import { farmSizeLabel } from "@/lib/crops/planting";
import { nextSprayWindow } from "@/lib/engine/pressure";
import { loadFarm, loadFarms, saveFarm } from "@/lib/farm";
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

  /**
   * Five fixed boxes rather than a ranked list. The screen is checked in thirty
   * seconds every morning by the same person, and knowing that water is always
   * first and fertiliser always second beats putting the most expensive item on
   * top. Urgency still reads, through each card's own tone.
   */
  const cards = useMemo(
    () => (plan && farm ? todayCards(farm, plan, lang) : []),
    [plan, farm, lang],
  );

  function recordFertiliser() {
    const saved = saveFarm({ ...loadFarm(), lastFertilisedAt: new Date().toISOString() });
    // The cards read from component state, so writing to storage alone leaves
    // the screen showing "not recorded" over a record that now exists.
    setFarm(saved);
    void refresh();
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="py-4">
      {demo && (
        <div
          className="mb-5 flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-[13px] font-bold"
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

      <PageHeader
        eyebrow={today}
        title={t("yourFarmToday")}
        subtitle={
          farm && crop ? (
            <>
              <CropIcon cropId={farm.cropId} size={20} />
              {cropName(crop, lang)} · {farmSizeLabel(farm, lang)} · {farm.village}
              {plotCount > 1 && (
                <Link href="/settings" className="font-bold" style={{ color: "var(--accent-ink)" }}>
                  {t("switchCrop")}
                </Link>
              )}
            </>
          ) : undefined
        }
      />

      {stale && (
        <p className="well mb-4 px-4 py-3 text-[14px]" style={{ color: "var(--ink-soft)" }}>
          {t("offlineNote")}
        </p>
      )}

      {loading && !plan && (
        <p className="py-10 text-center" style={{ color: "var(--ink-soft)" }}>{t("loadingPlan")}</p>
      )}

      {cards.length > 0 && (
        <section className="space-y-3">
          {cards.map((card, i) => (
            <TodayCard
              key={card.id}
              card={card}
              /* The engine already ranks these; the first is the morning's
                 answer, so it gets the room instead of a bigger number. */
              lead={i === 0}
              onAction={card.action ? recordFertiliser : undefined}
            />
          ))}
        </section>
      )}

      {plan && (
        <section className="mt-7">
          <RainOutlook wx={plan.weather} lang={lang} spray={spray} />
        </section>
      )}

      {/* Money belongs on the money screen; here it is a line, not a headline. */}
      {plan && (
        <Link
          href="/profit"
          className="press mt-7 flex items-center justify-between gap-3 rounded-[calc(var(--radius)+4px)] p-5"
          style={{ background: "var(--accent-soft)" }}
        >
          <span className="eyebrow" style={{ color: "var(--accent-ink)" }}>
            {plan.economics.bearing && plan.economics.yieldKnown && plan.economics.priceKnown
              ? t("expectedProfit")
              : t("spentThisSeason")}
          </span>
          <span className="tabular text-[1.5rem] font-extrabold leading-none" style={{ color: "var(--money)" }}>
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
        className="press well mt-4 w-full py-3.5 text-[15px] font-bold"
        style={{ color: "var(--ink-soft)" }}
      >
        {t("refresh")}
      </button>
    </main>
  );
}
