"use client";

import Link from "next/link";
import type { TodayCard as Card, Tone } from "@/lib/engine/today";

/**
 * One of the five fixed boxes on the Today screen.
 *
 * Tone is carried by a filled chip on the kicker, never by washing the whole
 * card — four or five of these sit together, and tinting each one turns the
 * screen into a traffic light. "calm" is a real state with its own colour: "no
 * watering needed today" is an answer, not an absence of one, and it should
 * look as settled as it is.
 *
 * `lead` gives the first card of the morning the room it deserves: a larger
 * icon and headline, and the card's own elevation. The rest stay compact, so
 * the screen still answers "what first?" without being read top to bottom.
 */
const TONE: Record<Tone, { ink: string; fill: string }> = {
  urgent: { ink: "var(--urgent)", fill: "var(--urgent-soft)" },
  act: { ink: "var(--signal)", fill: "var(--signal-soft)" },
  watch: { ink: "var(--accent-ink)", fill: "var(--accent-soft)" },
  calm: { ink: "var(--accent-ink)", fill: "var(--accent-soft)" },
  unknown: { ink: "var(--ink-faint)", fill: "var(--surface-2)" },
};

function rupees(n: number): string {
  return `${n < 0 ? "−" : "+"}₹${Math.abs(n).toLocaleString("en-IN")}`;
}

export function TodayCard({
  card,
  onAction,
  lead = false,
}: {
  card: Card;
  onAction?: () => void;
  lead?: boolean;
}) {
  const tone = TONE[card.tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="chip" style={{ color: tone.ink, background: tone.fill }}>
          {card.kicker}
        </span>
        <span
          aria-hidden
          className={lead ? "text-[28px] leading-none" : "text-[20px] leading-none"}
        >
          {card.icon}
        </span>
      </div>

      <h3 className={lead ? "t-title mt-3" : "t-headline mt-3"}>{card.headline}</h3>
      <p className={lead ? "t-body mt-2 text-[16px]" : "t-body mt-1.5"}>{card.detail}</p>

      {typeof card.rupees === "number" && card.rupees !== 0 && (
        <p
          className="tabular mt-3 inline-block rounded-full px-3 py-1.5 text-[14px] font-extrabold"
          style={{
            color: card.rupees < 0 ? "var(--urgent)" : "var(--money)",
            background: card.rupees < 0 ? "var(--urgent-soft)" : "var(--accent-soft)",
          }}
        >
          {rupees(card.rupees)}
        </p>
      )}
    </>
  );

  const shell = `${lead ? "card-lead p-5" : "card p-4"} block`;

  if (card.href && !card.action) {
    return (
      <Link href={card.href} className={`press ${shell}`}>
        {body}
      </Link>
    );
  }

  return (
    <article className={shell}>
      {body}
      {card.action && onAction && (
        <button
          onClick={onAction}
          className="press mt-4 w-full rounded-2xl py-3 text-[15px] font-extrabold"
          style={{ background: "var(--accent)", color: "var(--ground)" }}
        >
          {card.action.label}
        </button>
      )}
    </article>
  );
}
