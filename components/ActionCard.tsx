import type { Recommendation, Severity } from "@/lib/types";

const TONE: Record<Severity, { bg: string; fg: string; label: string }> = {
  urgent: { bg: "var(--urgent-soft)", fg: "var(--urgent)", label: "Do now" },
  act: { bg: "var(--act-soft)", fg: "var(--act)", label: "Today" },
  watch: { bg: "var(--accent-soft)", fg: "var(--watch)", label: "Keep an eye" },
  info: { bg: "transparent", fg: "var(--ink-soft)", label: "For info" },
};

function rupees(n: number): string {
  const sign = n < 0 ? "−" : "+";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN")}`;
}

export function ActionCard({ rec }: { rec: Recommendation }) {
  const tone = TONE[rec.severity];
  return (
    <article
      className="rounded-2xl border p-4"
      style={{
        background: rec.severity === "info" ? "var(--surface)" : tone.bg,
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-2xl leading-none">{rec.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: tone.fg, border: `1px solid ${tone.fg}` }}
            >
              {tone.label}
            </span>
            {rec.window && rec.window.toLowerCase() !== tone.label.toLowerCase() && (
              <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
                {rec.window}
              </span>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold leading-snug">{rec.title}</h3>
          <p className="mt-1 text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {rec.why}
          </p>
          {typeof rec.rupeeImpact === "number" && rec.rupeeImpact !== 0 && (
            <p
              className="mt-2 text-sm font-semibold tabular-nums"
              style={{ color: rec.rupeeImpact < 0 ? "var(--urgent)" : "var(--money)" }}
            >
              {rupees(rec.rupeeImpact)} at stake
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
