"use client";

import { msg } from "@/lib/messages";
import type { Recommendation, Severity } from "@/lib/types";
import { useLang } from "@/lib/use-lang";

/**
 * One action, with its arithmetic showing.
 *
 * Urgency is carried by a filled chip rather than a wash of colour across the
 * whole card — it survives sunlight, keeps the text on a plain surface, and
 * lets four cards of different urgency sit together without the screen turning
 * into a traffic light. Colour is never the only signal: each card also states
 * its urgency in words.
 */
const TONE: Record<Severity, { colour: string; fill: string; key: string }> = {
  urgent: { colour: "var(--urgent)", fill: "var(--urgent-soft)", key: "sev.urgent" },
  act: { colour: "var(--signal)", fill: "var(--signal-soft)", key: "sev.act" },
  watch: { colour: "var(--accent-ink)", fill: "var(--accent-soft)", key: "sev.watch" },
  info: { colour: "var(--ink-faint)", fill: "var(--surface-2)", key: "sev.info" },
};

function rupees(n: number): string {
  return `${n < 0 ? "−" : "+"}₹${Math.abs(n).toLocaleString("en-IN")}`;
}

export function ActionCard({ rec }: { rec: Recommendation }) {
  const { lang } = useLang();
  const tone = TONE[rec.severity];
  const label = msg(lang, tone.key);
  return (
    <article className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="chip" style={{ color: tone.colour, background: tone.fill }}>
            {label}
          </span>
          {rec.window && rec.window.toLowerCase() !== label.toLowerCase() && (
            <span className="text-[12px]" style={{ color: "var(--ink-faint)" }}>
              {rec.window}
            </span>
          )}
        </div>
        <span aria-hidden className="text-[20px] leading-none">{rec.icon}</span>
      </div>

      <h3 className="t-headline mt-3">{rec.title}</h3>
      <p className="t-body mt-1.5">{rec.why}</p>

      {typeof rec.rupeeImpact === "number" && rec.rupeeImpact !== 0 && (
        <p
          className="tabular mt-3 inline-block rounded-full px-3 py-1.5 text-[14px] font-extrabold"
          style={{
            color: rec.rupeeImpact < 0 ? "var(--urgent)" : "var(--money)",
            background: rec.rupeeImpact < 0 ? "var(--urgent-soft)" : "var(--accent-soft)",
          }}
        >
          {rupees(rec.rupeeImpact)} at stake
        </p>
      )}
    </article>
  );
}
