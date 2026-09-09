"use client";

import { gradeLabel, type CropConfig } from "@/lib/crops";
import type { Requirement } from "@/lib/requirements";

/**
 * A buyer's standing offer, as a farmer reads it.
 *
 * The offer is set against today's mandi modal for the same crop, because that
 * is the only number that tells a grower whether the offer is generous or an
 * attempt to buy cheap. Showing the offer alone would recreate exactly the
 * information gap this board exists to close.
 */
export function RequirementCard({
  req,
  crop,
  mandiPrice,
  mine,
  t,
  onClose,
}: {
  req: Requirement;
  crop: CropConfig;
  mandiPrice?: number;
  mine: boolean;
  t: (k: string, p?: Record<string, string | number>) => string;
  onClose: () => void;
}) {
  const gap = mandiPrice ? Math.round(((req.offerPerQtl - mandiPrice) / mandiPrice) * 100) : null;

  return (
    <li className="card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold">{req.business || req.contactName}</h3>
        <span className="tabular font-bold" style={{ color: "var(--money)" }}>
          ₹{req.offerPerQtl.toLocaleString("en-IN")}
        </span>
      </div>

      <p className="mt-0.5 text-sm" style={{ color: "var(--ink-soft)" }}>
        {t("reqWanted", { qtl: req.quintals })}
        {req.grade ? ` · ${gradeLabel(crop, req.grade)}` : ""}
        {req.district ? ` · ${req.district}` : ""}
      </p>

      {gap !== null && gap !== 0 && (
        <p className="mt-2 text-xs tabular-nums" style={{ color: gap > 0 ? "var(--accent)" : "var(--signal)" }}>
          {gap > 0 ? t("directAbove", { pct: gap }) : t("directBelow", { pct: Math.abs(gap) })}
        </p>
      )}

      {req.note && (
        <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>{req.note}</p>
      )}

      <div className="mt-3">
        {mine ? (
          <button
            onClick={onClose}
            className="press card px-3 py-2 text-sm font-semibold"
            style={{ color: "var(--ink-soft)" }}
          >
            {t("reqClose")}
          </button>
        ) : (
          <a
            href={`tel:+91${req.phone}`}
            className="press inline-block rounded-xl px-4 py-2.5 text-sm font-bold"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            📞 {t("directCall")} +91 {req.phone}
          </a>
        )}
      </div>
    </li>
  );
}
