"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CropIcon } from "@/components/CropIcon";
import { listCrops } from "@/lib/crops";
import type { Lang } from "@/lib/i18n";

/**
 * Crop search, for a buyer who deals in more than one.
 *
 * This replaced a native <select> holding all 122 crops. A dropdown that long
 * is unusable on a phone: no way in except scrolling, and the list is ordered
 * for the app's convenience rather than the buyer's. Typing two letters is the
 * only interaction that scales to a registry this size.
 *
 * Matching runs over both the crop's name in the buyer's own language and its
 * English name, because a trader reading Kannada may still know a crop by the
 * English word the mandi board prints.
 */
export function CropSearch({
  value,
  onChange,
  lang,
  label,
  changeLabel,
  searchLabel,
  emptyLabel,
}: {
  value: string;
  onChange: (cropId: string) => void;
  lang: Lang;
  label: string;
  changeLabel: string;
  searchLabel: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const crops = useMemo(() => listCrops(lang), [lang]);
  const current = crops.find((c) => c.id === value);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return crops.slice(0, 40);
    return crops
      .filter((c) => c.label.toLowerCase().includes(q) || c.english.toLowerCase().includes(q))
      .slice(0, 40);
  }, [crops, query]);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setQuery(""); }}
        className="press card mt-3 flex w-full items-center gap-3 p-3.5 text-left"
      >
        <CropIcon cropId={value} size={26} />
        <span className="min-w-0 flex-1">
          <span className="eyebrow block">{label}</span>
          <span className="mt-0.5 block truncate text-[16px] font-bold">
            {current?.label ?? value}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-bold" style={{ color: "var(--accent)" }}>
          {changeLabel}
        </span>
      </button>
    );
  }

  return (
    <div className="card mt-3 p-3">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchLabel}
        aria-label={searchLabel}
        className="w-full rounded-xl border px-3.5 py-3 text-base"
        style={{ borderColor: "var(--line)", background: "var(--ground)", color: "var(--ink)" }}
      />

      {results.length === 0 ? (
        <p className="px-1 py-4 text-sm" style={{ color: "var(--ink-soft)" }}>{emptyLabel}</p>
      ) : (
        <ul className="mt-2 max-h-[46vh] space-y-1 overflow-y-auto">
          {results.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => { onChange(c.id); setOpen(false); }}
                className="press flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left"
                style={
                  c.id === value
                    ? { background: "var(--accent-soft)", color: "var(--accent)" }
                    : undefined
                }
              >
                <CropIcon cropId={c.id} size={22} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{c.label}</span>
                  {c.label !== c.english && (
                    <span className="block truncate text-[12px]" style={{ color: "var(--ink-faint)" }}>
                      {c.english}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
