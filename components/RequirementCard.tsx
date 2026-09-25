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
        <h3 className="t-headline">{req.business || req.contactName}</h3>
        <span className="tabular text-[1.125rem] font-extrabold" style={{ color: "var(--money)" }}>
          ₹{req.offerPerQtl.toLocaleString("en-IN")}
        </span>
      </div>

      <p className="t-body mt-1">
        {t("reqWanted", { qtl: req.quintals })}
        {req.grade ? ` · ${gradeLabel(crop, req.grade)}` : ""}
        {req.district ? ` · ${req.district}` : ""}
      </p>

      {gap !== null && gap !== 0 && (
        <p
          className="chip mt-2.5 tabular-nums"
          style={{
            color: gap > 0 ? "var(--accent-ink)" : "var(--signal)",
            background: gap > 0 ? "var(--accent-soft)" : "var(--signal-soft)",
          }}
        >
          {gap > 0 ? t("directAbove", { pct: gap }) : t("directBelow", { pct: Math.abs(gap) })}
        </p>
      )}

      {req.note && (
        <p className="t-body mt-2.5">{req.note}</p>
      )}

      <div className="mt-3">
        {mine ? (
          <button
            onClick={onClose}
            className="press well px-4 py-2.5 text-[14px] font-bold"
            style={{ color: "var(--ink-soft)" }}
          >
            {t("reqClose")}
          </button>
        ) : (
          <a
            href={`tel:+91${req.phone}`}
            className="press inline-block rounded-2xl px-4 py-3 text-[14px] font-extrabold"
            style={{ background: "var(--accent)", color: "var(--ground)" }}
          >
            📞 {t("directCall")} +91 {req.phone}
          </a>
        )}
      </div>
    </li>
  );
}
