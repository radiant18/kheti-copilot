"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { cropName, getCrop, gradeLabel } from "@/lib/crops";
import { loadFarm, saveFarm } from "@/lib/farm";
import { rankSellOptions } from "@/lib/engine/market";
import { withTrend } from "@/lib/price-history";
import { currentRole, loadSession, type Role } from "@/lib/session";
import { CropIcon } from "@/components/CropIcon";
import { LotForm } from "@/components/LotForm";
import { CropSearch } from "@/components/CropSearch";
import { RequirementCard } from "@/components/RequirementCard";
import { RequirementForm } from "@/components/RequirementForm";
import { YardBar } from "@/components/YardBar";
import { useLang } from "@/lib/use-lang";
import type { Listing } from "@/lib/listings";
import type { Requirement } from "@/lib/requirements";
import type { Farm, Grade, MarketView } from "@/lib/types";

/**
 * Selling, on one screen.
 *
 * This used to be two: mandi yards here, direct buyers behind a link. That was
 * wrong. A grower opening "Sell" wants today's price and someone to sell to,
 * and burying half the answer one tap away meant most people never saw it.
 *
 * So the order is: what my crop is worth today, who wants it right now, then
 * the yards as the fallback route. A buyer gets the same screen with the two
 * middle sections swapped — the price, then the growers who have the crop.
 */
export default function SellPage() {
  const { t, lang } = useLang();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [role, setRole] = useState<Role>("farmer");
  const [phone, setPhone] = useState("");

  /** A buyer is not tied to one farm's crop, so they choose what to look at. */
  const [cropId, setCropId] = useState<string | null>(null);

  const [market, setMarket] = useState<MarketView | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [editingStock, setEditingStock] = useState(false);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async (f: Farm, crop: string) => {
    const [m, lots, reqs] = await Promise.all([
      apiGet<MarketView>("/api/market", { crop, state: f.state }).catch(() => null),
      apiGet<{ listings: Listing[] }>("/api/listings", { crop, state: f.state }).catch(() => ({
        listings: [] as Listing[],
      })),
      apiGet<{ requirements: Requirement[] }>("/api/requirements", {
        crop,
        state: f.state,
      }).catch(() => ({ requirements: [] as Requirement[] })),
    ]);
    setMarket(m ? withTrend(m) : null);
    setListings(lots.listings);
    setRequirements(reqs.requirements);
  }, []);

  useEffect(() => {
    const f = loadFarm();
    setFarm(f);
    setRole(currentRole());
    setPhone(loadSession()?.phone ?? "");
    setCropId(f.cropId);
  }, []);

  useEffect(() => {
    if (farm && cropId) void load(farm, cropId);
  }, [farm, cropId, load]);

  const crop = useMemo(() => (cropId ? getCrop(cropId) : null), [cropId]);

  const availableGrades = useMemo(
    () => (market ? [...new Set(market.quotes.map((q) => q.grade))] : []),
    [market],
  );
  const heldGrades = useMemo(
    () => (farm ? Object.keys(farm.stockQtl).filter((g) => farm.stockQtl[g] > 0) : []),
    [farm],
  );

  useEffect(() => {
    if (grade !== null) return;
    setGrade(heldGrades[0] ?? availableGrades[0] ?? null);
  }, [grade, heldGrades, availableGrades]);

  const quintals = farm && grade ? farm.stockQtl[grade] || 1 : 1;
  const yards = useMemo(
    () => (farm && market && grade ? rankSellOptions(farm, market, grade, quintals) : []),
    [farm, market, grade, quintals],
  );

  /** Best price on the board for the grade in focus — the headline number. */
  const headline = useMemo(() => {
    if (!market || market.quotes.length === 0) return null;
    const pool = grade ? market.quotes.filter((q) => q.grade === grade) : market.quotes;
    const from = pool.length > 0 ? pool : market.quotes;
    return from.slice().sort((a, b) => b.modalPerQtl - a.modalPerQtl)[0];
  }, [market, grade]);

  const trend = grade ? market?.weekChangePct[grade] ?? 0 : 0;

  /** Relevant demand first: my grades, then any-grade, then the rest. */
  const sortedRequirements = useMemo(() => {
    const rank = (r: Requirement) =>
      heldGrades.includes(r.grade) ? 0 : r.grade === "" ? 1 : 2;
    return [...requirements].sort(
      (a, b) => rank(a) - rank(b) || b.offerPerQtl - a.offerPerQtl,
    );
  }, [requirements, heldGrades]);

  function setStock(g: Grade, qtl: number) {
    setFarm((f) => {
      if (!f) return f;
      const stockQtl = { ...f.stockQtl };
      if (qtl > 0) stockQtl[g] = qtl;
      else delete stockQtl[g];
      const next = { ...f, stockQtl };
      saveFarm(next);
      return next;
    });
  }

  if (!farm || !crop || !cropId) return null;
  const refresh = () => void load(farm, cropId);
  const buyer = role === "buyer";

  return (
    <main className="py-5">
      <h1 className="text-2xl font-bold tracking-tight">
        {buyer ? t("buyerHomeTitle") : t("navSell")}
      </h1>

      {/* A buyer deals in several crops; a farmer's is fixed by their farm. */}
      {buyer ? (
        <CropSearch
          value={cropId}
          onChange={(id) => {
            setCropId(id);
            setGrade(null);
          }}
          lang={lang}
          label={t("buyingWhat")}
          changeLabel={t("changeCrop")}
          searchLabel={t("searchCrops")}
          emptyLabel={t("noCropMatch")}
        />
      ) : (
        <p className="mt-1 flex items-center gap-2 text-sm" style={{ color: "var(--ink-soft)" }}>
          <CropIcon cropId={cropId} size={22} />
          {cropName(crop, lang)} · {farm.state}
        </p>
      )}

      {/* 1. What it is worth today. Everything below is a way to act on it. */}
      <section className="card mt-4 p-5">
        <p className="eyebrow">{t("priceToday")}</p>
        {headline ? (
          <>
            <p className="tabular mt-1.5 text-[2.1rem] font-extrabold leading-none" style={{ color: "var(--money)" }}>
              ₹{headline.modalPerQtl.toLocaleString("en-IN")}
              <span className="ml-1 text-base font-semibold" style={{ color: "var(--ink-faint)" }}>
                /{t("quintalShort")}
              </span>
            </p>
            <p className="mt-1.5 text-sm" style={{ color: "var(--ink-soft)" }}>
              {cropName(crop, lang)} · {t("gradeSuffix", { grade: gradeLabel(crop, headline.grade) })} ·{" "}
              {headline.market} · {headline.date}
            </p>
            {trend !== 0 && (
              <p className="mt-1 text-sm font-semibold" style={{ color: trend > 0 ? "var(--money)" : "var(--urgent)" }}>
                {trend > 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% {t("thisWeek")}
              </p>
            )}
          </>
        ) : (
          <p className="mt-1.5 text-sm" style={{ color: "var(--ink-soft)" }}>{t("noPriceToday")}</p>
        )}
        {market && market.source !== "live" && (
          <p className="mt-2 text-xs" style={{ color: "var(--ink-faint)" }}>{t("samplePrices")}</p>
        )}
      </section>

      {/* 2. Someone to sell to, or buy from, right here. */}
      <section className="mt-6">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <h2 className="eyebrow">{buyer ? t("lotsForSale") : t("buyersReady")}</h2>
          <button
            onClick={() => setPosting((v) => !v)}
            className="text-sm font-bold"
            style={{ color: "var(--accent)" }}
          >
            {posting ? t("reqClose") : buyer ? t("postRequirement") : t("directPostCta")}
          </button>
        </div>

        {posting &&
          (buyer ? (
            <RequirementForm
              crop={crop}
              phone={phone}
              state={farm.state}
              district={farm.district}
              t={t}
              onDone={() => { setPosting(false); refresh(); }}
              onCancel={() => setPosting(false)}
            />
          ) : (
            <LotForm
              farm={{ ...farm, cropId }}
              phone={phone}
              t={t}
              onDone={() => { setPosting(false); refresh(); }}
              onCancel={() => setPosting(false)}
            />
          ))}

        {buyer ? (
          listings.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{t("directNone")}</p>
          ) : (
            <ul className="space-y-3">
              {listings.map((lot) => (
                <LotCard key={lot.id} lot={lot} crop={crop} market={market} phone={phone} t={t} onChanged={refresh} />
              ))}
            </ul>
          )
        ) : sortedRequirements.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{t("buyersNone")}</p>
        ) : (
          <ul className="space-y-3">
            {sortedRequirements.map((req) => (
              <RequirementCard
                key={req.id}
                req={req}
                crop={crop}
                mandiPrice={
                  req.grade
                    ? market?.quotes.find((q) => q.grade === req.grade)?.modalPerQtl
                    : headline?.modalPerQtl
                }
                mine={req.phone === phone}
                t={t}
                onClose={async () => {
                  await fetch("/api/requirements", {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ id: req.id, phone }),
                  });
                  refresh();
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* 3. The yard route, and the stock it is priced against. */}
      {!buyer && availableGrades.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="eyebrow">{t("yourStock")}</h2>
            <button onClick={() => setEditingStock((v) => !v)} className="text-sm font-bold" style={{ color: "var(--accent)" }}>
              {editingStock ? t("done") : t("edit")}
            </button>
          </div>

          {editingStock ? (
            <ul className="space-y-2">
              {availableGrades.map((g) => (
                <li key={g} className="card flex items-center justify-between gap-3 px-3 py-2">
                  <span className="font-medium">{gradeLabel(crop, g)}</span>
                  <span className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      value={farm.stockQtl[g] ?? ""}
                      onChange={(e) => setStock(g, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-20 rounded-lg border px-2 py-1.5 text-right tabular-nums"
                      style={{ borderColor: "var(--line)", background: "var(--ground)", color: "var(--ink)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--ink-soft)" }}>{t("quintalShort")}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : heldGrades.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {heldGrades.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className="rounded-full border px-3 py-1.5 text-sm font-medium"
                  style={{
                    borderColor: g === grade ? "var(--accent)" : "var(--line)",
                    background: g === grade ? "var(--accent-soft)" : "var(--surface)",
                    color: g === grade ? "var(--accent)" : "var(--ink-soft)",
                  }}
                >
                  {gradeLabel(crop, g)} · {farm.stockQtl[g]} {t("quintalShort")}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{t("stockHint")}</p>
          )}
        </section>
      )}

      {!buyer && yards.length > 0 && (
        <section className="mt-6">
          <h2 className="eyebrow mb-2.5">{t("yardsHeading")}</h2>
          <ol className="space-y-3">
            {yards.map((o, i) => (
              <YardBar
                key={`${o.quote.market}-${o.quote.grade}`}
                option={o}
                best={yards[0].net}
                floor={yards[yards.length - 1].net * 0.9}
                rank={i}
                gapLabel={
                  i === 0 && yards[1]
                    ? `₹${(o.net - yards[1].net).toLocaleString("en-IN")} better than the next yard`
                    : undefined
                }
              />
            ))}
          </ol>
        </section>
      )}

      <p className="mt-6 text-xs leading-relaxed" style={{ color: "var(--ink-faint)" }}>
        {t("directUnverified")}
      </p>
    </main>
  );
}

/** A grower's lot, as a buyer reads it. */
function LotCard({
  lot,
  crop,
  market,
  phone,
  t,
  onChanged,
}: {
  lot: Listing;
  crop: ReturnType<typeof getCrop>;
  market: MarketView | null;
  phone: string;
  t: (k: string, p?: Record<string, string | number>) => string;
  onChanged: () => void;
}) {
  const ref = market?.quotes
    .filter((q) => q.grade === lot.grade)
    .sort((a, b) => b.modalPerQtl - a.modalPerQtl)[0];
  const gap = ref ? Math.round(((lot.askPerQtl - ref.modalPerQtl) / ref.modalPerQtl) * 100) : null;
  const mine = lot.phone === phone;

  return (
    <li className="card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-bold">
          {gradeLabel(crop, lot.grade)} · {lot.quintals} {t("quintalShort")}
        </h3>
        <span className="tabular font-bold" style={{ color: "var(--money)" }}>
          ₹{lot.askPerQtl.toLocaleString("en-IN")}
        </span>
      </div>
      <p className="mt-0.5 text-sm" style={{ color: "var(--ink-soft)" }}>
        {lot.farmerName}
        {lot.village ? ` · ${lot.village}` : ""}
        {lot.district ? `, ${lot.district}` : ""}
      </p>
      {gap !== null && gap !== 0 && (
        <p className="mt-2 text-xs" style={{ color: gap > 0 ? "var(--signal)" : "var(--accent)" }}>
          {gap > 0 ? t("directAbove", { pct: gap }) : t("directBelow", { pct: Math.abs(gap) })}
        </p>
      )}
      {lot.note && <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>{lot.note}</p>}
      <div className="mt-3">
        {mine ? (
          <button
            onClick={async () => {
              await fetch("/api/listings", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id: lot.id, phone, status: "withdrawn" }),
              });
              onChanged();
            }}
            className="press card px-3 py-2 text-sm font-semibold"
            style={{ color: "var(--ink-soft)" }}
          >
            {t("directWithdraw")}
          </button>
        ) : (
          <a
            href={`tel:+91${lot.phone}`}
            className="press inline-block rounded-xl px-4 py-2.5 text-sm font-bold"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            📞 {t("directCall")} +91 {lot.phone}
          </a>
        )}
      </div>
    </li>
  );
}
