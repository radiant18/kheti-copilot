"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCrop } from "@/lib/crops";
import { clearFarmData, hasFarm, loadFarm } from "@/lib/farm";
import { loadSession, signOut, type Session } from "@/lib/session";
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
  const [farm, setFarm] = useState<Farm | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    if (hasFarm()) setFarm(loadFarm());
  }, []);

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
  const crop = farm ? getCrop(farm.cropId) : null;

  return (
    <main className="py-5">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Section title="Account">
        <Row label="Name" value={session.name} />
        <Row label="Mobile" value={`+91 ${session.phone}`} />
      </Section>

      {farm && crop ? (
        <Section title="Your farm">
          <Row label="Crop" value={`${crop.name.en} · ${crop.name.kn}`} />
          <Row label="Area" value={`${farm.acres} ${farm.acres === 1 ? "acre" : "acres"}`} />
          <Row
            label={crop.yield.kind === "perennial" ? "Planted" : "Sown"}
            value={crop.yield.kind === "perennial" ? String(farm.plantedYear) : (farm.plantedOn ?? "—")}
          />
          <Row label="Location" value={farm.village ? `${farm.village}, ${farm.district}` : "—"} />
          <Row label="Watering" value={farm.irrigation} caps />

          <Link
            href="/onboarding"
            className="mt-3 block rounded-xl border px-4 py-3 text-center font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--accent)" }}
          >
            Edit farm details
          </Link>
        </Section>
      ) : (
        <Section title="Your farm">
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            No farm set up on this phone yet.
          </p>
          <Link
            href="/onboarding"
            className="mt-3 block rounded-xl px-4 py-3 text-center font-semibold"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            Set up my farm
          </Link>
        </Section>
      )}

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
          style={{ borderColor: "var(--border)", color: "var(--ink)" }}
        >
          Log out
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
                style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              >
                Keep it
              </button>
              <button
                onClick={deleteData}
                className="flex-1 rounded-xl px-4 py-3 font-semibold"
                style={{ background: "var(--urgent)", color: "var(--bg)" }}
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
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
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
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-sm" style={{ color: "var(--ink-soft)" }}>{label}</span>
      <span className={`text-right font-medium${caps ? " capitalize" : ""}`}>{value}</span>
    </div>
  );
}
