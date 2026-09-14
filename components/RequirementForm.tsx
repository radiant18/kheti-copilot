"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import { gradeLabel, type CropConfig } from "@/lib/crops";
import { loadSession } from "@/lib/session";

/**
 * A buyer posting what they will take.
 *
 * Grade is optional — a mill buying in bulk often does not care, and forcing a
 * choice would either produce noise or stop them posting. Empty means any grade
 * of the crop, and the board reads it that way.
 *
 * Like a farmer's lot, the number comes off the proof token on the server — a
 * buyer's number is published to growers and is proved the same way.
 */
export function RequirementForm({
  crop,
  phone,
  state,
  district,
  t,
  onDone,
  onCancel,
}: {
  crop: CropConfig;
  phone: string;
  state: string;
  district: string;
  t: (k: string, p?: Record<string, string | number>) => string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [business, setBusiness] = useState(loadSession()?.name ?? "");
  const [grade, setGrade] = useState("");
  const [quintals, setQuintals] = useState("");
  const [offer, setOffer] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const ready = Number(quintals) > 0 && Number(offer) > 0 && consent && phone && !busy;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    try {
      const res = await apiSend("/api/requirements", "POST", {
          business,
          contactName: loadSession()?.name ?? "",
          publishPhone: consent,
          cropId: crop.id,
          grade,
          quintals: Number(quintals),
          offerPerQtl: Number(offer),
          district,
          state,
          note: note.trim() || undefined,
      });
      if (res.ok) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mt-4 space-y-4 p-4">
      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("reqBusiness")}</span>
        <input
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          className="card w-full px-3.5 py-3"
          style={{ color: "var(--ink)" }}
        />
      </label>

      {crop.grades.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["", ...crop.grades.map((g) => g.id)].map((g) => (
            <button
              key={g || "any"}
              onClick={() => setGrade(g)}
              className="rounded-full border px-3 py-1.5 text-sm font-medium"
              style={{
                borderColor: g === grade ? "var(--accent)" : "var(--line)",
                background: g === grade ? "var(--accent-soft)" : "var(--surface)",
                color: g === grade ? "var(--accent)" : "var(--ink-soft)",
              }}
            >
              {g ? gradeLabel(crop, g) : "Any grade"}
            </button>
          ))}
        </div>
      )}

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("reqWant")}</span>
        <input
          inputMode="decimal"
          value={quintals}
          onChange={(e) => setQuintals(e.target.value)}
          className="card w-full px-3.5 py-3 tabular-nums"
          style={{ color: "var(--ink)" }}
        />
      </label>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("reqOffer")}</span>
        <input
          inputMode="numeric"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="₹"
          className="card w-full px-3.5 py-3 tabular-nums"
          style={{ color: "var(--ink)" }}
        />
      </label>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("reqNote")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="card w-full px-3.5 py-3"
          style={{ color: "var(--ink)" }}
        />
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0"
        />
        <span style={{ color: "var(--ink-soft)" }}>{t("reqConsent")}</span>
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
          {t("reqPost")}
        </button>
      </div>
    </section>
  );
}
