"use client";

import { gradeLabel, type CropConfig } from "@/lib/crops";
import type { Grade, MandiQuote } from "@/lib/types";

/**
 * The whole day's board, every grade at once.
 *
 * The yard list above answers "where do I take what I have". This answers the
 * question underneath it, which is worth far more money: what is my crop worth
 * at each grade? On 7 September 2026 arecanut Rashi cleared ₹50,899/qtl while
 * CQCA cleared ₹27,000 — the same crop, the same week, nearly double. Drying
 * and sorting decisions move a lot of a grower's income across that gap, and
 * nothing else shows them the gap.
 *
 * Presented as fact, not advice: we show the board and mark what the farmer
 * holds. Whether a lot can actually be graded up is a judgement about that lot,
 * and the app has no business asserting it.
 */
export function GradeBoard({
  crop,
  quotes,
  held,
  heading,
  note,
}: {
  crop: CropConfig;
  quotes: MandiQuote[];
  held: Grade[];
  heading: string;
  /** Called with the computed spread, so the caller can translate with it. */
  note: (spread: number) => string;
}) {
  // Best price per grade, since one grade trades at several yards.
  const best = new Map<Grade, MandiQuote>();
  for (const q of quotes) {
    const current = best.get(q.grade);
    if (!current || q.modalPerQtl > current.modalPerQtl) best.set(q.grade, q);
  }

  const rows = [...best.values()].sort((a, b) => b.modalPerQtl - a.modalPerQtl);
  if (rows.length < 2) return null;

  const top = rows[0].modalPerQtl;
  const bottom = rows[rows.length - 1].modalPerQtl;
  const spread = Math.round(((top - bottom) / bottom) * 100);

  return (
    <section className="mt-7">
      <h2 className="eyebrow mb-2.5">{heading}</h2>

      <ul className="space-y-2.5">
        {rows.map((q) => {
          const mine = held.includes(q.grade);
          return (
            <li key={q.grade}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span
                  className="text-sm"
                  style={{
                    color: mine ? "var(--ink)" : "var(--ink-soft)",
                    fontWeight: mine ? 700 : 500,
                  }}
                >
                  {gradeLabel(crop, q.grade)}
                  {mine && <span style={{ color: "var(--accent)" }}> ●</span>}
                </span>
                <span
                  className="tabular text-sm font-bold"
                  style={{ color: mine ? "var(--accent)" : "var(--ink-soft)" }}
                >
                  ₹{q.modalPerQtl.toLocaleString("en-IN")}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(4, (q.modalPerQtl / top) * 100)}%`,
                    background: mine ? "var(--accent)" : "var(--line-strong)",
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--ink-faint)" }}>
        {note(spread)}
      </p>
    </section>
  );
}
