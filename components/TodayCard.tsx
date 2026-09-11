"use client";

import Link from "next/link";
import type { TodayCard as Card, Tone } from "@/lib/engine/today";

/**
 * One of the five fixed boxes on the Today screen.
 *
 * Tone is carried by a left stripe and the kicker colour, never by washing the
 * whole card — four or five of these sit together, and tinting each one turns
 * the screen into a traffic light. "calm" is a real state with its own colour:
 * "no watering needed today" is an answer, not an absence of one, and it should
 * look as settled as it is.
 */
const TONE: Record<Tone, string> = {
  urgent: "var(--urgent)",
  act: "var(--signal)",
  watch: "var(--accent)",
  calm: "var(--accent)",
  unknown: "var(--ink-faint)",
};

function rupees(n: number): string {
  return `${n < 0 ? "−" : "+"}₹${Math.abs(n).toLocaleString("en-IN")}`;
}

export function TodayCard({ card, onAction }: { card: Card; onAction?: () => void }) {
  const colour = TONE[card.tone];

  const body = (
    <>
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: colour }}
      />
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 text-xl leading-none">{card.icon}</span>
        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.09em]"
            style={{ color: colour }}
          >
            {card.kicker}
          </p>
          <h3 className="mt-1.5 text-[17px] font-bold leading-snug">{card.headline}</h3>
          <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {card.detail}
          </p>

          {typeof card.rupees === "number" && card.rupees !== 0 && (
            <p
              className="tabular mt-2.5 inline-block rounded-md px-2 py-1 text-[13px] font-bold"
              style={{
                color: card.rupees < 0 ? "var(--urgent)" : "var(--money)",
                background: card.rupees < 0 ? "var(--urgent-soft)" : "var(--accent-soft)",
              }}
            >
              {rupees(card.rupees)}
            </p>
          )}
        </div>
      </div>
    </>
  );

  if (card.href && !card.action) {
    return (
      <Link href={card.href} className="press card relative block overflow-hidden p-4">
        {body}
      </Link>
    );
  }

  return (
    <article className="card relative overflow-hidden p-4">
      {body}
      {card.action && onAction && (
        <button
          onClick={onAction}
          className="press mt-3 w-full rounded-xl border py-2.5 text-[14px] font-bold"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          {card.action.label}
        </button>
      )}
    </article>
  );
}
