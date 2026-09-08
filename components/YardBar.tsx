import type { SellOption } from "@/lib/engine/market";

/**
 * One mandi, drawn to scale against the best one.
 *
 * The whole product argument is that the same crop fetches materially different
 * money at different yards once the lorry is paid for. A column of numbers
 * makes the reader do that comparison; a bar does it for them, and the gap
 * between the top two bars is the feature in one glance.
 *
 * Bars are scaled from 90% of the lowest net, not from zero — every yard pays
 * within a few percent of the others, so a zero-based axis would render seven
 * near-identical bars and hide exactly the difference that matters. The rupee
 * figures are printed beside them so the scale cannot mislead.
 */
export function YardBar({
  option,
  best,
  floor,
  rank,
  gapLabel,
}: {
  option: SellOption;
  best: number;
  floor: number;
  rank: number;
  gapLabel?: string;
}) {
  const span = Math.max(1, best - floor);
  const width = Math.max(6, Math.round(((option.net - floor) / span) * 100));
  const top = rank === 0;

  return (
    <li
      className="card p-4"
      style={top ? { borderColor: "var(--accent)", background: "var(--accent-soft)" } : undefined}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[17px] font-bold">
          {top && <span aria-hidden>⭐ </span>}
          {option.quote.market}
        </h3>
        <span className="tabular text-[17px] font-extrabold" style={{ color: "var(--money)" }}>
          ₹{option.net.toLocaleString("en-IN")}
        </span>
      </div>

      <div
        aria-hidden
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-2)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: top ? "var(--accent)" : "var(--line-strong)",
          }}
        />
      </div>

      <p className="tabular mt-2 text-[13px]" style={{ color: "var(--ink-soft)" }}>
        ₹{option.quote.modalPerQtl.toLocaleString("en-IN")}/qtl × {option.quintals} qtl
        {option.distanceKnown
          ? ` − ₹${option.transport.toLocaleString("en-IN")} (${option.quote.distanceKm} km)`
          : ""}
      </p>

      {gapLabel && (
        <p className="mt-2 text-[14px] font-bold" style={{ color: "var(--accent)" }}>
          {gapLabel}
        </p>
      )}
    </li>
  );
}
