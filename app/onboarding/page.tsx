"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { estimatedQtlPerAcre, getCrop, listCrops } from "@/lib/crops";
import { blankFarm, DEMO_FARM, hasFarm, loadFarm, loadFarms, saveFarm, switchCrop } from "@/lib/farm";
import { placesIn, STATES, type Place } from "@/lib/places";
import { loadSession, markOnboarded } from "@/lib/session";
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

  const crops = useMemo(() => listCrops(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return crops;
    return crops.filter((c) => c.en.toLowerCase().includes(q) || c.kn.includes(q));
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
      setLocError("This phone cannot share its location. Pick your taluk from the list instead.");
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
        setLocError("Could not get your location. Pick your taluk from the list instead.");
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
    if (!f.acres || f.acres <= 0) return "Enter how many acres you have under this crop.";
    if (crop.yield.kind === "seasonal") {
      if (!f.plantedOn) return "Choose the date you planted, so we know when your harvest is due.";
    } else {
      const year = new Date().getFullYear();
      if (!f.plantedYear) return "Enter the year you planted.";
      if (f.plantedYear < 1900 || f.plantedYear > year) {
        return `Enter a planting year between 1900 and ${year}.`;
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
            style={{ background: i <= stepIndex ? "var(--accent)" : "var(--border)" }}
          />
        ))}
      </div>

      {step === "crop" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">
            {isAdding ? "Add another crop" : "What do you grow?"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            {isAdding
              ? "This is saved as a separate plot, with its own stock and expenses."
              : "Pick your main crop. You can change it later."}
          </p>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search crops…"
            className="mt-4 w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          />

          <ul className="mt-3 space-y-2">
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => pickCrop(c.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left"
                  style={{
                    borderColor: c.id === farm.cropId ? "var(--accent)" : "var(--border)",
                    background: c.id === farm.cropId ? "var(--accent-soft)" : "var(--surface)",
                  }}
                >
                  <span>
                    <span className="block font-semibold">{c.en}</span>
                    <span className="block text-sm" style={{ color: "var(--ink-soft)" }}>{c.kn}</span>
                  </span>
                  {c.depth === "modelled" ? (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: "var(--accent)", border: "1px solid var(--accent)" }}
                    >
                      Full advice
                    </span>
                  ) : c.depth === "partial" ? (
                    <span className="shrink-0 text-[11px]" style={{ color: "var(--ink-soft)" }}>
                      No disease rules
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px]" style={{ color: "var(--ink-soft)" }}>
                      Prices only
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            <strong>Full advice</strong> crops get irrigation timing plus disease and spray
            windows. <strong>No disease rules</strong> crops get watering cycles and a harvest
            estimate, but no spray warnings — often because the main threat is an insect or a
            dry-weather mildew, which these rules cannot detect.
            <strong> Prices only</strong> crops get mandi prices, selling advice and your cost
            book. Every crop gets live prices.
          </p>
        </>
      )}

      {step === "location" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Where is your farm?</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            This sets your weather forecast and which markets are near you.
          </p>

          <button
            onClick={useGps}
            disabled={locating}
            className="mt-4 w-full rounded-xl border px-4 py-3 font-semibold"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            {locating ? "Finding you…" : "📍 Use my current location"}
          </button>

          {locError && (
            <p className="mt-2 text-sm" style={{ color: "var(--urgent)" }}>{locError}</p>
          )}

          <p className="my-4 text-center text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
            or choose manually
          </p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>State</span>
            <select
              value={farm.state}
              onChange={(e) => update("state", e.target.value)}
              className="w-full rounded-xl border px-3 text-base"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
            >
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <div className="mt-4">
            <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
              Nearest town or taluk
            </span>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {placesIn(farm.state).map((p) => (
                <li key={`${p.district}-${p.name}`}>
                  <button
                    onClick={() => pickPlace(p)}
                    className="w-full rounded-xl border px-4 py-2.5 text-left"
                    style={{
                      borderColor: farm.village === p.name ? "var(--accent)" : "var(--border)",
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
                  No towns listed for {farm.state} yet — use your current location above.
                </li>
              )}
            </ul>
          </div>

          <p className="mt-4 text-sm tabular-nums" style={{ color: "var(--ink-soft)" }}>
            Selected: {farm.village || "—"} · {farm.lat}, {farm.lon}
          </p>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setStep("crop")}
              className="rounded-xl border px-4 py-3 font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
            >
              Back
            </button>
            <button
              onClick={() => setStep("details")}
              className="flex-1 rounded-xl px-4 py-3 font-semibold"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <h1 className="text-2xl font-bold tracking-tight">About your {crop.name.en.toLowerCase()}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
            These set your watering cycle and expected harvest.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                Area under {crop.name.en.toLowerCase()} (acres)
              </span>
              <input
                inputMode="decimal"
                value={farm.acres || ""}
                onChange={(e) => update("acres", Number(e.target.value) || 0)}
                className="w-full rounded-xl border px-3 text-base"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              />
            </label>

            {crop.yield.kind === "perennial" ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                  Year planted
                </span>
                <input
                  inputMode="numeric"
                  value={farm.plantedYear || ""}
                  onChange={(e) => update("plantedYear", Number(e.target.value) || 0)}
                  className="w-full rounded-xl border px-3 text-base"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                />
              </label>
            ) : (
              /* Seasonal crops need the actual date: the gap between sowing and
                 harvest is months, not years, and it decides whether this farm
                 has a crop coming or one ready to sell. */
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                  When did you plant it?
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
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
                />
                <span className="mt-1.5 block text-xs" style={{ color: "var(--ink-soft)" }}>
                  {crop.name.en} takes about {Math.round(crop.yield.cycleDays / 30)} months from
                  planting to harvest.
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                Expected harvest (quintals per acre)
              </span>
              <input
                inputMode="decimal"
                value={farm.expectedQtlPerAcre ?? ""}
                placeholder={`About ${estimatedQtlPerAcre(crop)} for ${crop.name.en.toLowerCase()}`}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  update("expectedQtlPerAcre", e.target.value === "" || !Number.isFinite(v) ? undefined : v);
                }}
                className="w-full rounded-xl border px-3 text-base"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
              />
              <span className="mt-1.5 block text-xs leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                Leave blank to use our estimate.{crop.yieldNote ? ` ${crop.yieldNote}` : ""} Your own
                figure from last year is always better than ours.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
                How do you water it?
              </span>
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
            </label>
          </div>

          {detailsError && (
            <p className="mt-4 text-sm" style={{ color: "var(--urgent)" }}>{detailsError}</p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setStep("location")}
              className="rounded-xl border px-4 py-3 font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}
            >
              Back
            </button>
            <button
              onClick={finish}
              className="flex-1 rounded-xl px-4 py-3 font-semibold"
              style={{ background: "var(--accent)", color: "var(--bg)" }}
            >
              See my farm plan
            </button>
          </div>

          <button
            onClick={() => { setFarm(DEMO_FARM); setDetailsError(null); }}
            className="mt-4 w-full text-center text-xs underline"
            style={{ color: "var(--ink-soft)" }}
          >
            Use the demo garden (3 acres of mature arecanut) instead
          </button>
        </>
      )}
    </main>
  );
}
