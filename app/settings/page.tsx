"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCrop, harvestOutlook } from "@/lib/crops";
import { farmSizeLabel } from "@/lib/crops/planting";
import {
  activeFarmId,
  clearFarmData,
  loadFarms,
  removeFarm,
  setActiveFarm,
} from "@/lib/farm";
import { loadSession, signOut, type Session } from "@/lib/session";
import { useLang } from "@/lib/use-lang";
import { DailyPlanToggle } from "@/components/DailyPlanToggle";
import type { Farm } from "@/lib/types";

/**
 * Settings.
 *
 * Two destructive actions live here and they are deliberately different:
 * signing out keeps the farm on the device so coming back restores it, while
 * deleting farm data is unrecoverable and therefore asks twice.
 */
export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingPlot, setConfirmingPlot] = useState<string | null>(null);
  const { t, lang } = useLang();

  function refresh() {
    setFarms(loadFarms());
    setActiveId(activeFarmId());
  }

  useEffect(() => {
    setSession(loadSession());
    refresh();
  }, []);

  function choosePlot(id: string) {
    setActiveFarm(id);
    setActiveId(id);
  }

  function deletePlot(id: string) {
    removeFarm(id);
    setConfirmingPlot(null);
    refresh();
  }

  function logOut() {
    signOut();
    router.replace("/login");
  }

  function deleteData() {
    clearFarmData();
    signOut();
    router.replace("/login");
  }

  if (!session) return null;

  return (
    <main className="py-5">
      <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>

      <Section title={t("account")}>
        <Row label="Name" value={session.name} />
        <Row label="Mobile" value={`+91 ${session.phone}`} />
      </Section>

      <section className="mt-6">
        <h2
          className="mb-2 text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--ink-soft)" }}
        >
          {t("yourCrops")}
        </h2>

        {farms.length === 0 ? (
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
          >
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              No crop set up on this phone yet.
            </p>
            <Link
              href="/onboarding"
              className="mt-3 block rounded-xl px-4 py-3 text-center font-semibold"
              style={{ background: "var(--accent)", color: "var(--ground)" }}
            >
              Set up my first crop
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {farms.map((f) => {
              const crop = getCrop(f.cropId);
              const outlook = harvestOutlook(
                crop,
                f.plantedYear,
                f.plantedOn,
                new Date(),
                f.expectedQtlPerAcre,
              );
              const active = f.id === activeId;
              return (
                <li
                  key={f.id}
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--line)",
                    background: active ? "var(--accent-soft)" : "var(--surface)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {crop.name.en} · {crop.name.kn}
                      </h3>
                      <p className="mt-0.5 text-sm" style={{ color: "var(--ink-soft)" }}>
                        {farmSizeLabel(f, lang)}
                        {f.village ? ` · ${f.village}` : ""}
                      </p>
                      <p className="mt-0.5 text-sm" style={{ color: "var(--ink-soft)" }}>
                        {outlook.bearing
                          ? `${Math.round(outlook.qtlPerAcre * f.acres * 10) / 10} qtl expected`
                          : `Not bearing yet — around ${outlook.firstHarvestOn ?? "unknown"}`}
                      </p>
                    </div>
                    {active ? (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--accent)", border: "1px solid var(--accent)" }}
                      >
                        Showing
                      </span>
                    ) : (
                      <button
                        onClick={() => choosePlot(f.id)}
                        className="shrink-0 rounded-xl border px-3 py-1.5 text-sm font-semibold"
                        style={{ borderColor: "var(--line)", color: "var(--accent)" }}
                      >
                        Show this
                      </button>
                    )}
                  </div>

                  {confirmingPlot === f.id ? (
                    <div className="mt-3">
                      <p className="text-sm font-semibold">
                        Remove this {crop.name.en.toLowerCase()} plot?
                      </p>
                      <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
                        Its stock and expenses go with it. This cannot be undone.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => setConfirmingPlot(null)}
                          className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold"
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        >
                          Keep it
                        </button>
                        <button
                          onClick={() => deletePlot(f.id)}
                          className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold"
                          style={{ background: "var(--urgent)", color: "var(--ground)" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="mt-3 flex gap-4 border-t pt-3 text-sm font-semibold"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <Link
                        href="/onboarding"
                        onClick={() => choosePlot(f.id)}
                        style={{ color: "var(--accent)" }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirmingPlot(f.id)}
                        style={{ color: "var(--urgent)" }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {farms.length > 0 && (
          <Link
            href="/onboarding?mode=add"
            className="mt-3 block rounded-xl border border-dashed px-4 py-3 text-center font-semibold"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            + {t("addAnotherCrop")}
          </Link>
        )}
      </section>

      <Section title={t("dailyPlanTitle")}>
        <DailyPlanToggle
          title={t("dailyPlanTitle")}
          note={t("dailyPlanNote")}
          onLabel={t("dailyPlanOn")}
          offLabel={t("dailyPlanOff")}
          needsPhone={t("dailyPlanNeedsPhone")}
        />
      </Section>

      <Section title="About">
        <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          Weather from Open-Meteo. Mandi prices from Agmarknet via data.gov.in. Spray and
          irrigation advice comes from fixed agronomic rules, not a chatbot — every
          recommendation shows the numbers behind it.
        </p>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          Your farm details are stored on this phone only. Signing out keeps them, so you
          get everything back next time you sign in.
        </p>
      </Section>

      <div className="mt-8 space-y-3">
        <button
          onClick={logOut}
          className="w-full rounded-xl border px-4 py-3.5 text-base font-semibold"
          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
        >
          {t("logOut")}
        </button>

        {confirmingDelete ? (
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--urgent)", background: "var(--urgent-soft)" }}
          >
            <p className="text-sm font-semibold">Delete your farm and all your expenses?</p>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
              Your crop, location, stock and cost book will be gone for good. This cannot be
              undone.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="flex-1 rounded-xl border px-4 py-3 font-semibold"
                style={{ borderColor: "var(--line)", color: "var(--ink)" }}
              >
                Keep it
              </button>
              <button
                onClick={deleteData}
                className="flex-1 rounded-xl px-4 py-3 font-semibold"
                style={{ background: "var(--urgent)", color: "var(--ground)" }}
              >
                Delete everything
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ color: "var(--urgent)" }}
          >
            Delete farm data
          </button>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2
        className="mb-2 text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-soft)" }}
      >
        {title}
      </h2>
      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({ label, value, caps }: { label: string; value: string; caps?: boolean }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0"
      style={{ borderColor: "var(--line)" }}
    >
      <span className="text-sm" style={{ color: "var(--ink-soft)" }}>{label}</span>
      <span className={`text-right font-medium${caps ? " capitalize" : ""}`}>{value}</span>
    </div>
  );
}
