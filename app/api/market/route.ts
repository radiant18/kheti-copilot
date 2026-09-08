import { NextResponse } from "next/server";
import { normaliseGrade } from "@/lib/grades";
import type { ArecaGrade, MandiQuote, MarketView } from "@/lib/types";
import { SAMPLE_QUOTES } from "@/lib/sample-market";

/**
 * Agmarknet arecanut prices via the data.gov.in Open Government Data platform.
 *
 * Get a free key at https://data.gov.in/user (sign in, then "My Account" ->
 * API key) and set DATA_GOV_API_KEY. The shared sample key in the public docs
 * is aggressively rate-limited and will 429 during a demo.
 *
 * The feed is genuinely messy: variety names are free text and vary by mandi
 * clerk, arrivals are patchy, and some yards report days late. normaliseGrade()
 * absorbs the spelling drift; anything unrecognised is dropped rather than
 * guessed at, because a wrong grade means wrong money.
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

function toQuotes(records: OgdRecord[]): MandiQuote[] {
  const out: MandiQuote[] = [];
  for (const r of records) {
    const grade = normaliseGrade(r.variety ?? "");
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
}

function summarise(quotes: MandiQuote[], live: boolean): MarketView {
  const byGrade = new Map<ArecaGrade, number[]>();
  for (const q of quotes) {
    if (!byGrade.has(q.grade)) byGrade.set(q.grade, []);
    byGrade.get(q.grade)!.push(q.modalPerQtl);
  }

  const stateModal: Partial<Record<ArecaGrade, number>> = {};
  const weekChangePct: Partial<Record<ArecaGrade, number>> = {};
  for (const [grade, prices] of byGrade) {
    stateModal[grade] = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
    // TODO: replace with a real 7-day lookback once price history is persisted.
    // Until then this stays at zero rather than inventing a trend.
    weekChangePct[grade] = 0;
  }

  return {
    updatedAt: new Date().toISOString(),
    quotes,
    stateModal,
    weekChangePct,
    ...(live ? {} : { sample: true }),
  } as MarketView;
}

export async function GET() {
  const key = process.env.DATA_GOV_API_KEY;

  if (!key) {
    // Demo must never show a blank screen. The client labels this clearly.
    return NextResponse.json(summarise(SAMPLE_QUOTES, false));
  }

  const url =
    `${ENDPOINT}?api-key=${key}&format=json&limit=200` +
    "&filters%5Bstate.keyword%5D=Karnataka" +
    "&filters%5Bcommodity%5D=Arecanut(Betelnut/Supari)";

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`ogd ${res.status}`);
    const body = (await res.json()) as { records?: OgdRecord[] };
    const quotes = toQuotes(body.records ?? []);
    if (quotes.length === 0) return NextResponse.json(summarise(SAMPLE_QUOTES, false));
    return NextResponse.json(summarise(quotes, true));
  } catch {
    return NextResponse.json(summarise(SAMPLE_QUOTES, false));
  }
}
