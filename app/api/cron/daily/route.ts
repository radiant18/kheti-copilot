import { NextResponse } from "next/server";
import { buildPlan } from "@/lib/engine";
import { buildShareMessage } from "@/lib/plan-message";
import { listSubscribers, markSent } from "@/lib/subscribers";
import { isConfigured, sendDailyPlan, type SendResult } from "@/lib/whatsapp";
import type { MarketView, WeatherWindow } from "@/lib/types";

/**
 * The 5am send.
 *
 * Vercel Cron calls this once a day (see vercel.json — 23:30 UTC is 05:00 IST).
 * For each farmer who opted in it rebuilds today's plan from live weather and
 * mandi prices, renders the same message the app shows, and sends it.
 *
 * The plan is recomputed here rather than cached from the farmer's last visit,
 * because the whole value of a 5am message is that it reflects this morning's
 * forecast — a stale irrigation call is worse than none.
 *
 * Runs sequentially and skips anyone already sent to today, so a retry after a
 * partial failure cannot double-send. That matters: WhatsApp charges per
 * conversation and a farmer who gets the same plan twice stops trusting it.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel sets this header on cron invocations; refuse anything else in prod. */
function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function origin(req: Request): Promise<string> {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(req: Request) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const base = await origin(req);
  const today = new Date().toISOString().slice(0, 10);
  const subscribers = await listSubscribers();
  const results: SendResult[] = [];

  for (const sub of subscribers) {
    if (sub.lastSentOn === today) continue;

    try {
      const [wx, market] = await Promise.all([
        fetch(`${base}/api/weather?lat=${sub.farm.lat}&lon=${sub.farm.lon}`).then(
          (r) => r.json() as Promise<WeatherWindow>,
        ),
        fetch(`${base}/api/market?crop=${sub.farm.cropId}&state=${encodeURIComponent(sub.farm.state)}`)
          .then((r) => r.json() as Promise<MarketView>)
          .catch(() => null),
      ]);

      const plan = buildPlan(sub.farm, wx, market, sub.costs);
      const message = buildShareMessage(sub.farm, plan, sub.lang);
      const result = await sendDailyPlan(sub.phone, message);

      results.push(result);
      if (result.ok) await markSent(sub.phone, today);
    } catch (err) {
      results.push({ phone: sub.phone, ok: false, dryRun: false, detail: String(err) });
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    configured: isConfigured(),
    considered: subscribers.length,
    sent: results.filter((r) => r.ok).length,
    results,
  });
}
