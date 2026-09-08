"use client";

import { useEffect, useState } from "react";
import { loadFarm, saveFarm } from "@/lib/farm";
import type { Farm } from "@/lib/types";

/**
 * Farm profile. Every field here exists because a rule reads it — nothing is
 * collected "for later". Location, acreage, planting year, irrigation method
 * and stock are the complete input surface of the engine.
 */
export default function OnboardingPage() {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => setFarm(loadFarm()), []);
  if (!farm) return null;

  function update<K extends keyof Farm>(key: K, value: Farm[K]) {
    setFarm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  }

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setFarm((f) =>
        f ? { ...f, lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4) } : f,
      );
      setSaved(false);
    });
  }

  return (
    <main className="py-5">
      <h1 className="text-2xl font-bold tracking-tight">Your farm</h1>

      <div className="mt-4 space-y-4">
        <Field label="Village">
          <input
            value={farm.village}
            onChange={(e) => update("village", e.target.value)}
            className="w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          />
        </Field>

        <Field label="Area under arecanut (acres)">
          <input
            inputMode="decimal"
            value={farm.acres}
            onChange={(e) => update("acres", Number(e.target.value) || 0)}
            className="w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          />
        </Field>

        <Field label="Year planted">
          <input
            inputMode="numeric"
            value={farm.plantedYear}
            onChange={(e) => update("plantedYear", Number(e.target.value) || 0)}
            className="w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          />
        </Field>

        <Field label="Irrigation">
          <select
            value={farm.irrigation}
            onChange={(e) => update("irrigation", e.target.value as Farm["irrigation"])}
            className="w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          >
            {(["drip", "sprinkler", "flood", "rainfed"] as const).map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </Field>

        <Field label={`Location — ${farm.lat}, ${farm.lon}`}>
          <button
            onClick={useMyLocation}
            className="w-full rounded-xl border px-3 py-2 text-sm font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--accent)" }}
          >
            Use my current location
          </button>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Last irrigated">
            <input
              type="date"
              value={farm.lastIrrigatedAt?.slice(0, 10) ?? ""}
              onChange={(e) => update("lastIrrigatedAt", new Date(e.target.value).toISOString())}
              className="w-full rounded-xl border px-3 text-base"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </Field>
          <Field label="Last Bordeaux spray">
            <input
              type="date"
              value={farm.lastSprayAt?.slice(0, 10) ?? ""}
              onChange={(e) => update("lastSprayAt", new Date(e.target.value).toISOString())}
              className="w-full rounded-xl border px-3 text-base"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            />
          </Field>
        </div>
      </div>

      <button
        onClick={() => {
          saveFarm(farm);
          setSaved(true);
        }}
        className="mt-6 w-full rounded-xl px-4 py-3 font-semibold"
        style={{ background: "var(--accent)", color: "var(--bg)" }}
      >
        {saved ? "Saved ✓" : "Save farm"}
      </button>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
