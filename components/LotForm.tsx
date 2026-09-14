"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import { getCrop, gradeLabel } from "@/lib/crops";
import { loadSession } from "@/lib/session";
import type { Farm } from "@/lib/types";

/**
 * A grower offering a lot straight to buyers.
 *
 * Grades offered are the ones the farmer holds stock in, falling back to the
 * crop's full grade list so somebody who has not filled in their stock can
 * still post.
 *
 * The number is not in the body: the server takes it from the proof token the
 * device earned at sign-in, so a lot can only ever publish the poster's own.
 */
export function LotForm({
  farm,
  phone,
  t,
  onDone,
  onCancel,
}: {
  farm: Farm;
  phone: string;
  t: (k: string, p?: Record<string, string | number>) => string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const crop = getCrop(farm.cropId);
  const heldGrades = Object.keys(farm.stockQtl).filter((g) => farm.stockQtl[g] > 0);
  const grades = heldGrades.length > 0 ? heldGrades : crop.grades.map((g) => g.id);

  const [grade, setGrade] = useState(grades[0] ?? "standard");
  const [quintals, setQuintals] = useState(String(farm.stockQtl[grades[0]] ?? ""));
  const [ask, setAsk] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const ready = Number(quintals) > 0 && Number(ask) > 0 && consent && phone && !busy;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    try {
      const res = await apiSend("/api/listings", "POST", {
          farmerName: loadSession()?.name ?? "",
          publishPhone: consent,
          cropId: farm.cropId,
          grade,
          quintals: Number(quintals),
          askPerQtl: Number(ask),
          village: farm.village,
          district: farm.district,
          state: farm.state,
          note: note.trim() || undefined,
      });
      if (res.ok) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mt-4 space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        {grades.map((g) => (
          <button
            key={g}
            onClick={() => setGrade(g)}
            className="rounded-full border px-3 py-1.5 text-sm font-medium"
            style={{
              borderColor: g === grade ? "var(--accent)" : "var(--line)",
              background: g === grade ? "var(--accent-soft)" : "var(--surface)",
              color: g === grade ? "var(--accent)" : "var(--ink-soft)",
            }}
          >
            {gradeLabel(crop, g)}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("directQuantity")}</span>
        <input
          inputMode="decimal"
          value={quintals}
          onChange={(e) => setQuintals(e.target.value)}
          className="card w-full px-3.5 py-3 tabular-nums"
          style={{ color: "var(--ink)" }}
        />
      </label>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("directAsk")}</span>
        <input
          inputMode="numeric"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="₹"
          className="card w-full px-3.5 py-3 tabular-nums"
          style={{ color: "var(--ink)" }}
        />
      </label>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("directNote")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="card w-full px-3.5 py-3"
          style={{ color: "var(--ink)" }}
        />
      </label>

      {/* Publishing a phone number is the one thing here that cannot be undone
          once a buyer has written it down, so it is never implied. */}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0"
        />
        <span style={{ color: "var(--ink-soft)" }}>{t("directConsent")}</span>
      </label>

      <div className="flex gap-2">
        <button onClick={onCancel} className="press card px-4 py-3 font-semibold" style={{ color: "var(--ink-soft)" }}>
          ✕
        </button>
        <button
          onClick={() => void submit()}
          disabled={!ready}
          className="press flex-1 rounded-xl py-3 font-bold"
          style={{
            background: ready ? "var(--accent)" : "var(--surface-2)",
            color: ready ? "var(--ground)" : "var(--ink-faint)",
          }}
        >
          {t("directPost")}
        </button>
      </div>
    </section>
  );
}
