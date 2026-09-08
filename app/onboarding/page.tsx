"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cropName, estimatedQtlPerAcre, getCrop, listCrops } from "@/lib/crops";
import { blankFarm, DEMO_FARM, hasFarm, loadFarm, loadFarms, saveFarm, switchCrop } from "@/lib/farm";
import { placesIn, STATES, type Place } from "@/lib/places";
import { loadSession, markOnboarded } from "@/lib/session";
import { useLang } from "@/lib/use-lang";
import type { Farm } from "@/lib/types";

/**
 * Three-step setup: crop, location, garden.
 *
 * One question per screen. Farmers abandon long forms, and each step here maps
 * to something the engine genuinely needs — the crop picks the rule set, the
 * location drives weather and which mandis are near, the garden details set
 * irrigation cycles and expected yield.
 */
type Step = "crop" | "location" | "details";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("crop");
  const [farm, setFarm] = useState<Farm | null>(null);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { lang, t } = useLang();

  useEffect(() => {
    if (!loadSession()) {
      router.replace("/login");
      return;
    }
    // Read from location rather than useSearchParams so the page needs no
    // Suspense boundary during static export (which the Capacitor build uses).
    const adding = new URLSearchParams(window.location.search).get("mode") === "add";
    setIsAdding(adding);

    const name = loadSession()?.name ?? "";
    if (adding) {
      // A second plot is usually beside the first, so carry the location over.
      setFarm(blankFarm(name, hasFarm() ? loadFarm() : undefined));
    } else {
      // Editing an existing plot loads it; a first-time grower starts empty so
      // no demo acreage or planting year leaks into their numbers.
      setFarm(hasFarm() ? loadFarm() : blankFarm(name));
    }
  }, [router]);

  const crops = useMemo(() => listCrops(lang), [lang]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return crops;
    // Match either script, so a farmer can type in their own language or in
    // English and still land on the same crop.
    return crops.filter(
      (c) => c.label.toLowerCase().includes(q) || c.english.toLowerCase().includes(q),
    );
  }, [crops, query]);

  if (!farm) return null;
  const crop = getCrop(farm.cropId);

  function update<K extends keyof Farm>(key: K, value: Farm[K]) {
    setFarm((f) => (f ? { ...f, [key]: value } : f));
    setDetailsError(null);
  }

  function pickCrop(id: string) {
    setFarm((f) => (f ? switchCrop(f, id) : f));
    setStep("location");
  }

  function pickPlace(p: Place) {
    setFarm((f) => (f ? { ...f, lat: p.lat, lon: p.lon, village: p.name, district: p.district } : f));
  }

  function useGps() {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError(t("locNoGeo"));
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFarm((f) =>
          f
            ? { ...f, lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4) }
            : f,
        );
        setLocating(false);
      },
      () => {
        setLocError(t("locFailed"));
        setLocating(false);
      },
      { timeout: 10_000 },
    );
  }

  /**
   * Both of these feed the yield model directly, so a blank or nonsense value
   * would produce a confident and wrong harvest projection. Better to block.
   */
  function detailsProblem(f: Farm): string | null {
    if (!f.acres || f.acres <= 0) return t("errAcres");
    if (crop.yield.kind === "seasonal") {
      if (!f.plantedOn) return t("errPlantDate");
    } else {
      const year = new Date().getFullYear();
      if (!f.plantedYear) return t("errYear");
      if (f.plantedYear < 1900 || f.plantedYear > year) {
        return t("errYearRange", { year });
      }
    }
    return null;
  }

  function finish() {
    const problem = detailsProblem(farm!);
    if (problem) {
      setDetailsError(problem);
      return;
    }
    const session = loadSession();
    saveFarm({ ...farm!, ownerName: session?.name ?? farm!.ownerName });
    markOnboarded();
    router.push("/");
  }

  const stepIndex = { crop: 0, location: 1, details: 2 }[step];

  return (
    <main className="py-5">
      <div className="mb-5 flex gap-1.5" aria-label={`Step ${stepIndex + 1} of 3`}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i <= stepIndex ? "var(--accent)" : "var(--line)" }}
          />
        ))}
      </div>

      {step === "crop" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdding ? t("addAnotherCrop") : t("whatDoYouGrow")}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            {isAdding
              ? t("separatePlot")
              : t("pickMainCrop")}
          </p>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchCrops")}
            className="mt-4 w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
          />

          <ul className="mt-3 space-y-2">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => pickCrop(c.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left"
                  style={{
                    borderColor: c.id === farm.cropId ? "var(--accent)" : "var(--line)",
                    background: c.id === farm.cropId ? "var(--accent-soft)" : "var(--surface)",
                  }}
                >
<span>
                    <span className="block text-[17px] font-bold leading-snug">{c.label}</span>
                    {/* Only show English underneath when it adds something —
                        never the same word twice. */}
                    {c.label !== c.english && (
                      <span className="mt-0.5 block text-[13px]" style={{ color: "var(--ink-faint)" }}>
                        {c.english}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

        </>
      )}

      {step === "location" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">{t("whereIsFarm")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            {t("locationHint")}
          </p>

          <button
            onClick={useGps}
            disabled={locating}
            className="mt-4 w-full rounded-xl border px-4 py-3 font-semibold"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            {locating ? t("finding") : `📍 ${t("useMyLocation")}`}
          </button>

          {locError && (
            <p className="mt-2 text-sm" style={{ color: "var(--urgent)" }}>{locError}</p>
          )}

          <p className="my-4 text-center text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
            {t("orChooseManually")}
          </p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>{t("state")}</span>
            <select
              value={farm.state}
              onChange={(e) => update("state", e.target.value)}
              className="w-full rounded-xl border px-3 text-base"
              style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
            >
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <div className="mt-4">
            <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
              {t("nearestTown")}
            </span>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {placesIn(farm.state).map((p) => (
                <li key={`${p.district}-${p.name}`}>
                  <button
                    onClick={() => pickPlace(p)}
                    className="w-full rounded-xl border px-4 py-2.5 text-left"
                    style={{
                      borderColor: farm.village === p.name ? "var(--accent)" : "var(--line)",
                      background: farm.village === p.name ? "var(--accent-soft)" : "var(--surface)",
                    }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="ml-2 text-sm" style={{ color: "var(--ink-soft)" }}>{p.district}</span>
                  </button>
                </li>
              ))}
              {placesIn(farm.state).length === 0 && (
                <li className="text-sm" style={{ color: "var(--ink-soft)" }}>
                  {t("noTowns", { state: farm.state })}
                </li>
              )}
            </ul>
          </div>

          <p className="mt-4 text-sm tabular-nums" style={{ color: "var(--ink-soft)" }}>
            {t("selected")}: {farm.village || "—"} · {farm.lat}, {farm.lon}
          </p>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setStep("crop")}
              className="rounded-xl border px-4 py-3 font-semibold"
              style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
            >
              {t("back")}
            </button>
            <button
              onClick={() => setStep("details")}
              className="flex-1 rounded-xl px-4 py-3 font-semibold"
              style={{ background: "var(--accent)", color: "var(--ground)" }}
            >
              {t("next")}
            </button>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("aboutYour", { crop: cropName(crop, lang) })}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            {t("detailsHint")}
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                {t("areaUnder", { crop: cropName(crop, lang) })}
              </span>
              <input
                inputMode="decimal"
                value={farm.acres || ""}
                onChange={(e) => update("acres", Number(e.target.value) || 0)}
                className="w-full rounded-xl border px-3 text-base"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              />
            </label>

            {crop.yield.kind === "perennial" ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                  {t("yearPlanted")}
                </span>
                <input
                  inputMode="numeric"
                  value={farm.plantedYear || ""}
                  onChange={(e) => update("plantedYear", Number(e.target.value) || 0)}
                  className="w-full rounded-xl border px-3 text-base"
                  style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                />
              </label>
            ) : (
              /* Seasonal crops need the actual date: the gap between sowing and
                 harvest is months, not years, and it decides whether this farm
                 has a crop coming or one ready to sell. */
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                  {t("whenPlanted")}
                </span>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={farm.plantedOn?.slice(0, 10) ?? ""}
                  onChange={(e) => {
                    const iso = e.target.value;
                    setFarm((f) =>
                      f
                        ? { ...f, plantedOn: iso, plantedYear: Number(iso.slice(0, 4)) || f.plantedYear }
                        : f,
                    );
                    setDetailsError(null);
                  }}
                  className="w-full rounded-xl border px-3 text-base"
                  style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
                />
                <span className="mt-1.5 block text-xs" style={{ color: "var(--ink-soft)" }}>
                  {t("cycleHint", {
                    crop: cropName(crop, lang),
                    months: Math.round(crop.yield.cycleDays / 30),
                  })}
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                {t("expectedHarvest")}
              </span>
              <input
                inputMode="decimal"
                value={farm.expectedQtlPerAcre ?? ""}
                placeholder={t("harvestAbout", { n: estimatedQtlPerAcre(crop), crop: cropName(crop, lang) })}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  update("expectedQtlPerAcre", e.target.value === "" || !Number.isFinite(v) ? undefined : v);
                }}
                className="w-full rounded-xl border px-3 text-base"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <span className="mt-1.5 block text-xs leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                {t("harvestHint")}
                {/* yieldNote is free text in the registry and exists only in English. */}
                {crop.yieldNote ? ` ${crop.yieldNote}` : ""}
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                {t("howWater")}
              </span>
              <select
                value={farm.irrigation}
                onChange={(e) => update("irrigation", e.target.value as Farm["irrigation"])}
                className="w-full rounded-xl border px-3 text-base"
                style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
              >
                {(["drip", "sprinkler", "flood", "rainfed"] as const).map((i) => (
                  <option key={i} value={i}>{t(`irr.${i}`)}</option>
                ))}
              </select>
            </label>
          </div>

          {detailsError && (
            <p className="mt-4 text-sm" style={{ color: "var(--urgent)" }}>{detailsError}</p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setStep("location")}
              className="rounded-xl border px-4 py-3 font-semibold"
              style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}
            >
              {t("back")}
            </button>
            <button
              onClick={finish}
              className="flex-1 rounded-xl px-4 py-3 font-semibold"
              style={{ background: "var(--accent)", color: "var(--ground)" }}
            >
              {t("seeMyPlan")}
            </button>
          </div>

          <button
            onClick={() => { setFarm(DEMO_FARM); setDetailsError(null); }}
            className="mt-4 w-full text-center text-xs underline"
            style={{ color: "var(--ink-soft)" }}
          >
            {t("useDemo")}
          </button>
        </>
      )}
    </main>
  );
}
