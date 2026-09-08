import type { Recommendation, Severity } from "@/lib/types";

/**
 * One action, with its arithmetic showing.
 *
 * Urgency is carried by a left stripe rather than a wash of colour across the
 * whole card — it survives sunlight, keeps the text on a plain surface, and
 * lets four cards of different urgency sit together without the screen turning
 * into a traffic light. Colour is never the only signal: each card also states
 * its urgency in words.
 */
const TONE: Record<Severity, { colour: string; label: string }> = {
  urgent: { colour: "var(--urgent)", label: "Do now" },
  act: { colour: "var(--signal)", label: "Today" },
  watch: { colour: "var(--accent)", label: "Keep an eye" },
  info: { colour: "var(--ink-faint)", label: "For info" },
};

function rupees(n: number): string {
  return `${n < 0 ? "−" : "+"}₹${Math.abs(n).toLocaleString("en-IN")}`;
}

export function ActionCard({ rec }: { rec: Recommendation }) {
  const tone = TONE[rec.severity];
  return (
    <article className="card relative overflow-hidden pl-4 pr-4 py-4">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: tone.colour }}
      />
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-xl leading-none">{rec.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.09em]"
              style={{ color: tone.colour }}
            >
              {tone.label}
            </span>
            {rec.window && rec.window.toLowerCase() !== tone.label.toLowerCase() && (
              <span className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
                · {rec.window}
              </span>
            )}
          </div>

          <h3 className="mt-1.5 text-[17px] font-bold leading-snug">{rec.title}</h3>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {rec.why}
          </p>

          {typeof rec.rupeeImpact === "number" && rec.rupeeImpact !== 0 && (
            <p
              className="tabular mt-2.5 inline-block rounded-md px-2 py-1 text-[13px] font-bold"
              style={{
                color: rec.rupeeImpact < 0 ? "var(--urgent)" : "var(--money)",
                background: rec.rupeeImpact < 0 ? "var(--urgent-soft)" : "var(--accent-soft)",
              }}
            >
              {rupees(rec.rupeeImpact)} at stake
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
