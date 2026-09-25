"use client";

import { useEffect, useState } from "react";
import { apiSend } from "@/lib/api";
import { loadCosts, loadFarm } from "@/lib/farm";
import { loadSession, phoneVerified } from "@/lib/session";

const KEY = "kheti.dailyPlan.v1";

/**
 * Opt in to the 5am WhatsApp message.
 *
 * Default off, and off means the server row is deleted rather than flagged —
 * a farmer who turns this off should stop existing in the send list, not sit
 * there marked inactive.
 *
 * Turning it on uploads a copy of the farm profile, because the job runs while
 * the phone is asleep and the server has no other copy (see lib/subscribers.ts).
 * That is worth being plain about, so the note under the switch says the plan
 * is sent, not merely prepared.
 *
 * The switch stays inert until the number has been proved. The server will not
 * point a morning message at an unproved number, and a switch that flips and
 * then quietly fails is worse than one that says what it is waiting for.
 */
export function DailyPlanToggle({
  title,
  note,
  onLabel,
  offLabel,
  needsPhone,
}: {
  title: string;
  note: string;
  onLabel: string;
  offLabel: string;
  needsPhone: string;
}) {
  const [on, setOn] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = loadSession();
    setPhone(phoneVerified() ? session?.phone ?? "" : "");
    try {
      setOn(window.localStorage.getItem(KEY) === "1");
    } catch {
      setOn(false);
    }
  }, []);

  async function toggle() {
    if (!phone || busy) return;
    const next = !on;
    setBusy(true);

    try {
      const session = loadSession();
      const res = await apiSend("/api/subscribe", "POST", {
        name: session?.name ?? "",
        lang: session?.lang ?? "en",
        role: session?.role ?? "farmer",
        enabled: next,
        farm: next ? loadFarm() : undefined,
        costs: next ? loadCosts() : undefined,
      });
      if (!res.ok) return;

      setOn(next);
      try {
        window.localStorage.setItem(KEY, next ? "1" : "0");
      } catch {
        /* the server is the source of truth; this only remembers the switch */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {phone ? note : needsPhone}
        </p>
      </div>

      <button
        role="switch"
        aria-checked={on}
        aria-label={title}
        disabled={!phone || busy}
        onClick={() => void toggle()}
        className="press mt-0.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
        style={{
          background: on ? "var(--accent)" : "var(--surface-2)",
          color: on ? "var(--ground)" : "var(--ink-faint)",
          opacity: phone ? 1 : 0.5,
        }}
      >
        {on ? onLabel : offLabel}
      </button>
    </div>
  );
}
