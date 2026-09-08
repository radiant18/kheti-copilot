import type { WeatherWindow } from "@/lib/types";

/**
 * Seven days at a glance.
 *
 * Dry hours matter more here than temperature — that is the number deciding
 * whether a spray is possible at all — so it gets a bar rather than another
 * line of text, and the wettest day is obvious without reading any of them.
 */
export function WeatherStrip({ wx }: { wx: WeatherWindow }) {
  const peak = Math.max(1, ...wx.days.map((d) => d.rainMm));

  return (
    <section className="-mx-5 overflow-x-auto px-5">
      <div className="flex gap-2 pb-1" style={{ minWidth: "min-content" }}>
        {wx.days.map((d, i) => {
          const day = new Date(d.date);
          const wet = d.rainMm >= 10;
          return (
            <div
              key={d.date}
              className="card w-[68px] shrink-0 px-2 py-2.5 text-center"
              style={i === 0 ? { borderColor: "var(--accent)" } : undefined}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}>
                {day.toLocaleDateString("en-IN", { weekday: "short" })}
              </div>
              <div aria-hidden className="my-1 text-[17px]">
                {wet ? "🌧️" : d.rainMm > 1 ? "🌦️" : "☀️"}
              </div>
              <div className="tabular text-[13px] font-bold">{d.rainMm.toFixed(0)}mm</div>
              <div
                aria-hidden
                className="mx-auto mt-1.5 h-1 w-full overflow-hidden rounded-full"
                style={{ background: "var(--surface-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((d.rainMm / peak) * 100)}%`,
                    background: wet ? "var(--signal)" : "var(--accent)",
                  }}
                />
              </div>
              <div className="tabular mt-1.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                {d.dryHours}h dry
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
