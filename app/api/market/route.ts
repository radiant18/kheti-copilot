import { NextResponse } from "next/server";
import { getCrop, normaliseGrade } from "@/lib/crops";
import type { Grade, MandiQuote, MarketView } from "@/lib/types";
import { sampleQuotesFor } from "@/lib/sample-market";

/**
 * Agmarknet prices via the data.gov.in Open Government Data platform, for any
 * commodity in any state.
 *
 * Free key at https://data.gov.in — sign in, then My Account -> API key. The
 * shared sample key in the public docs is aggressively rate-limited and will
 * 429 during a demo.
 *
 * The feed is genuinely messy: commodity and variety names are free text and
 * vary by mandi clerk, arrivals are patchy, and some yards report days late.
 * So we try the exact commodity filter first and fall back to a loose match
 * over a wider state pull — a near-miss on the commodity string degrades to a
 * slower query rather than an empty screen.
 */

const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
const ENDPOINT = `https://api.data.gov.in/resource/${RESOURCE}`;

interface OgdRecord {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  arrival_date?: string;
  min_price?: string;
  max_price?: string;
  modal_price?: string;
}

async function pull(key: string, state: string, commodity?: string): Promise<OgdRecord[]> {
  const params = new URLSearchParams({
    "api-key": key,
    format: "json",
    limit: commodity ? "300" : "2000",
    "filters[state.keyword]": state,
  });
  if (commodity) params.set("filters[commodity]", commodity);

  const res = await fetch(`${ENDPOINT}?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`ogd ${res.status}`);
  const body = (await res.json()) as { records?: OgdRecord[] };
  return body.records ?? [];
}

/** Loose commodity match, for when the exact registry string misses the feed. */
function looselyMatches(recordCommodity: string, target: string): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const a = clean(recordCommodity);
  const b = clean(target);
  return a.includes(b) || b.includes(a);
}

function summarise(
  quotes: MandiQuote[],
  cropId: string,
  source: MarketView["source"],
): MarketView {
  const byGrade = new Map<Grade, number[]>();
  for (const q of quotes) {
    if (!byGrade.has(q.grade)) byGrade.set(q.grade, []);
    byGrade.get(q.grade)!.push(q.modalPerQtl);
  }

  const stateModal: Record<Grade, number> = {};
  for (const [grade, prices] of byGrade) {
    stateModal[grade] = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  }

  return {
    updatedAt: new Date().toISOString(),
    quotes,
    stateModal,
    // Filled in client-side from locally recorded snapshots; the feed has no history.
    weekChangePct: {},
    cropId,
    source,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cropId = searchParams.get("crop") ?? "arecanut";
  const state = searchParams.get("state") ?? "Karnataka";
  const crop = getCrop(cropId);

  const toQuotes = (records: OgdRecord[]): MandiQuote[] => {
    const out: MandiQuote[] = [];
    for (const r of records) {
      const grade = normaliseGrade(crop, r.variety ?? "");
      if (!grade || !r.market) continue;
      const modal = Number(r.modal_price);
      if (!Number.isFinite(modal) || modal <= 0) continue;
      out.push({
        market: r.market.trim(),
        district: (r.district ?? "").trim(),
        grade,
        modalPerQtl: modal,
        minPerQtl: Number(r.min_price) || modal,
        maxPerQtl: Number(r.max_price) || modal,
        date: r.arrival_date ?? new Date().toISOString().slice(0, 10),
      });
    }
    return out;
  };

  // No key: only arecanut has bundled sample data. Everything else says so.
  const key = process.env.DATA_GOV_API_KEY;
  if (!key) {
    // Every crop has a fallback board, so no crop is ever a dead end. The
    // response is tagged so the Sell screen can say these are not today's
    // prices — the app degrades honestly rather than silently.
    return NextResponse.json(summarise(sampleQuotesFor(cropId), cropId, "unconfigured"));
  }

  try {
    let records = await pull(key, state, crop.agmarknetCommodity);

    if (records.length === 0) {
      const wide = await pull(key, state);
      records = wide.filter((r) => looselyMatches(r.commodity ?? "", crop.name.en));
    }

    const quotes = toQuotes(records);
    // A live pull that comes back empty — a crop that did not trade in this
    // state today — still beats a blank screen, so fall back and say so.
    if (quotes.length === 0) {
      return NextResponse.json(summarise(sampleQuotesFor(cropId), cropId, "sample"));
    }
    return NextResponse.json(summarise(quotes, cropId, "live"));
  } catch {
    return NextResponse.json(summarise(sampleQuotesFor(cropId), cropId, "sample"));
  }
}
