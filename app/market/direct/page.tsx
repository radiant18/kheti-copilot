"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { cropName, getCrop, gradeLabel, type CropConfig } from "@/lib/crops";
import { loadFarm } from "@/lib/farm";
import { currentRole, loadSession, type Role } from "@/lib/session";
import { useLang } from "@/lib/use-lang";
import type { Listing } from "@/lib/listings";
import type { Requirement } from "@/lib/requirements";
import { RequirementCard } from "@/components/RequirementCard";
import { RequirementForm } from "@/components/RequirementForm";
import type { Farm, MarketView } from "@/lib/types";

/**
 * Direct sale, farmer to buyer.
 *
 * Every lot carries today's mandi price for the same grade beside the asking
 * price. That comparison is the point: a grower who can see the yard is paying
 * ₹50,891 is much harder to talk down to ₹44,000, and a buyer can see instantly
 * whether a lot is worth a call. Without it this is just a noticeboard.
 *
 * Kheti introduces the two sides and stops there — no payment, no escrow, no
 * grading arbitration. Standing between two people's money needs a licence and
 * a dispute process, and pretending otherwise would put farmers at risk.
 */
export default function DirectSalePage() {
  const { t } = useLang();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [phone, setPhone] = useState("");
  const [market, setMarket] = useState<MarketView | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [posting, setPosting] = useState(false);
  const [role, setRole] = useState<Role>("farmer");

  const refresh = useCallback(async (f: Farm) => {
    const [lots, reqs] = await Promise.all([
      apiGet<{ listings: Listing[] }>("/api/listings", { crop: f.cropId, state: f.state }),
      apiGet<{ requirements: Requirement[] }>("/api/requirements", {
        crop: f.cropId,
        state: f.state,
      }).catch(() => ({ requirements: [] as Requirement[] })),
    ]);
    setListings(lots.listings);
    setRequirements(reqs.requirements);
  }, []);

  useEffect(() => {
    const f = loadFarm();
    setFarm(f);
    setPhone(loadSession()?.phone ?? "");
    setRole(currentRole());
    void refresh(f);
    apiGet<MarketView>("/api/market", { crop: f.cropId, state: f.state })
      .then(setMarket)
      .catch(() => setMarket(null));
  }, [refresh]);

  /** Best mandi price per grade today, the yardstick every lot is shown against. */
  const mandi = useMemo(() => {
    const best = new Map<string, { price: number; market: string }>();
    for (const q of market?.quotes ?? []) {
      const cur = best.get(q.grade);
      if (!cur || q.modalPerQtl > cur.price) best.set(q.grade, { price: q.modalPerQtl, market: q.market });
    }
    return best;
  }, [market]);

  if (!farm) return null;
  const crop = getCrop(farm.cropId);

  return (
    <main className="py-5">
      {/* Buyers have no Sell tab to go back to; this board is their home. */}
      {role === "farmer" && (
        <p className="mb-1 text-sm">
          <Link href="/market" style={{ color: "var(--accent)" }}>← {t("navSell")}</Link>
        </p>
      )}
      <h1 className="text-2xl font-bold tracking-tight">
        {role === "buyer" ? t("buyerHomeTitle") : t("directTitle")}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
        {role === "buyer" ? t("buyerHomeBlurb") : t("directBlurb")}
      </p>

      {!posting && (
        <button
          onClick={() => setPosting(true)}
          className="press mt-4 w-full rounded-xl py-3.5 text-base font-bold"
          style={{ background: "var(--accent)", color: "var(--ground)" }}
        >
          {role === "buyer" ? t("postRequirement") : t("directPostCta")}
        </button>
      )}

      {posting &&
        (role === "buyer" ? (
          <RequirementForm
            crop={crop}
            phone={phone}
            state={farm.state}
            district={farm.district}
            t={t}
            onDone={() => {
              setPosting(false);
              void refresh(farm);
            }}
            onCancel={() => setPosting(false)}
          />
        ) : (
          <PostForm
            farm={farm}
            phone={phone}
            t={t}
            onDone={() => {
              setPosting(false);
              void refresh(farm);
            }}
            onCancel={() => setPosting(false)}
          />
        ))}

      {/* Demand first for a grower — knowing somebody will pay ₹51,500 is more
          use than seeing what neighbours are asking. Buyers get supply first
          for the same reason reversed. */}
      {role === "farmer" && (
        <BuyersSection
          requirements={requirements}
          crop={crop}
          mandi={mandi}
          phone={phone}
          t={t}
          onChanged={() => void refresh(farm)}
        />
      )}

      <h2 className="eyebrow mt-7 mb-2.5">
        {t("lotsForSale")} · {cropName(crop, "en")}
      </h2>

      {listings.length === 0 && (
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{t("directNone")}</p>
      )}

      <ul className="space-y-3">
        {listings.map((lot) => {
          const ref = mandi.get(lot.grade);
          const gap = ref ? Math.round(((lot.askPerQtl - ref.price) / ref.price) * 100) : null;
          const mine = lot.phone === phone;

          return (
            <li key={lot.id} className="card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-bold">
                  {gradeLabel(crop, lot.grade)} · {lot.quintals} qtl
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

              {ref && (
                <p className="mt-2 text-xs tabular-nums" style={{ color: "var(--ink-faint)" }}>
                  {t("directMandiRef", { price: ref.price.toLocaleString("en-IN"), market: ref.market })}
                  {gap !== null && gap !== 0 && (
                    <span style={{ color: gap > 0 ? "var(--signal)" : "var(--accent)" }}>
                      {" · "}
                      {gap > 0
                        ? t("directAbove", { pct: gap })
                        : t("directBelow", { pct: Math.abs(gap) })}
                    </span>
                  )}
                </p>
              )}

              {lot.note && (
                <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>{lot.note}</p>
              )}

              <div className="mt-3 flex gap-2">
                {mine ? (
                  <>
                    <StatusButton lot={lot} phone={phone} status="sold" label={t("directSold")} onDone={() => void refresh(farm)} />
                    <StatusButton lot={lot} phone={phone} status="withdrawn" label={t("directWithdraw")} onDone={() => void refresh(farm)} />
                  </>
                ) : (
                  <a
                    href={`tel:+91${lot.phone}`}
                    className="press rounded-xl px-4 py-2.5 text-sm font-bold"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    📞 {t("directCall")} +91 {lot.phone}
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {role === "buyer" && (
        <BuyersSection
          requirements={requirements}
          crop={crop}
          mandi={mandi}
          phone={phone}
          t={t}
          onChanged={() => void refresh(farm)}
        />
      )}

      <p className="mt-6 text-xs leading-relaxed" style={{ color: "var(--ink-faint)" }}>
        {t("directUnverified")}
      </p>
    </main>
  );
}

function BuyersSection({
  requirements,
  crop,
  mandi,
  phone,
  t,
  onChanged,
}: {
  requirements: Requirement[];
  crop: CropConfig;
  mandi: Map<string, { price: number; market: string }>;
  phone: string;
  t: (k: string, p?: Record<string, string | number>) => string;
  onChanged: () => void;
}) {
  /** Best mandi price for the crop, used when a buyer wants any grade. */
  const topMandi = Math.max(0, ...[...mandi.values()].map((m) => m.price));

  return (
    <section className="mt-7">
      <h2 className="eyebrow mb-2.5">{t("buyersReady")}</h2>

      {requirements.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{t("buyersNone")}</p>
      ) : (
        <ul className="space-y-3">
          {requirements.map((req) => (
            <RequirementCard
              key={req.id}
              req={req}
              crop={crop}
              mandiPrice={req.grade ? mandi.get(req.grade)?.price : topMandi || undefined}
              mine={req.phone === phone}
              t={t}
              onClose={async () => {
                await fetch("/api/requirements", {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ id: req.id, phone }),
                });
                onChanged();
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function StatusButton({
  lot,
  phone,
  status,
  label,
  onDone,
}: {
  lot: Listing;
  phone: string;
  status: Listing["status"];
  label: string;
  onDone: () => void;
}) {
  return (
    <button
      onClick={async () => {
        await fetch("/api/listings", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: lot.id, phone, status }),
        });
        onDone();
      }}
      className="press card px-3 py-2 text-sm font-semibold"
      style={{ color: "var(--ink-soft)" }}
    >
      {label}
    </button>
  );
}

function PostForm({
  farm,
  phone,
  t,
  onDone,
  onCancel,
}: {
  farm: Farm;
  phone: string;
  t: (k: string, p?: Record<string, string | number>) => string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const crop = getCrop(farm.cropId);
  const heldGrades = Object.keys(farm.stockQtl).filter((g) => farm.stockQtl[g] > 0);
  const grades = heldGrades.length > 0 ? heldGrades : crop.grades.map((g) => g.id);

  const [grade, setGrade] = useState(grades[0] ?? "standard");
  const [quintals, setQuintals] = useState(String(farm.stockQtl[grades[0]] ?? ""));
  const [ask, setAsk] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const ready = Number(quintals) > 0 && Number(ask) > 0 && consent && phone && !busy;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          farmerName: loadSession()?.name ?? "",
          phone,
          publishPhone: consent,
          cropId: farm.cropId,
          grade,
          quintals: Number(quintals),
          askPerQtl: Number(ask),
          village: farm.village,
          district: farm.district,
          state: farm.state,
          note: note.trim() || undefined,
        }),
      });
      if (res.ok) onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mt-4 space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        {grades.map((g) => (
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
            {gradeLabel(crop, g)}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("directQuantity")}</span>
        <input
          inputMode="decimal"
          value={quintals}
          onChange={(e) => setQuintals(e.target.value)}
          className="card w-full px-3.5 py-3 tabular-nums"
          style={{ color: "var(--ink)" }}
        />
      </label>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("directAsk")}</span>
        <input
          inputMode="numeric"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="₹"
          className="card w-full px-3.5 py-3 tabular-nums"
          style={{ color: "var(--ink)" }}
        />
      </label>

      <label className="block">
        <span className="eyebrow mb-1.5 block">{t("directNote")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          className="card w-full px-3.5 py-3"
          style={{ color: "var(--ink)" }}
        />
      </label>

      {/* Publishing a phone number is the one thing here that cannot be undone
          once a buyer has written it down, so it is never implied. */}
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0"
        />
        <span style={{ color: "var(--ink-soft)" }}>{t("directConsent")}</span>
      </label>

      <div className="flex gap-2">
        <button onClick={onCancel} className="press card px-4 py-3 font-semibold" style={{ color: "var(--ink-soft)" }}>
          ✕
        </button>
        <button
          onClick={() => void submit()}
          disabled={!ready}
          className="press flex-1 rounded-xl py-3 font-bold"
          style={{
            background: ready ? "var(--accent)" : "var(--surface-2)",
            color: ready ? "var(--ground)" : "var(--ink-faint)",
          }}
        >
          {t("directPost")}
        </button>
      </div>
    </section>
  );
}
