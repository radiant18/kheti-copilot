import type { WeatherWindow } from "@/lib/types";

/**
 * Seven days at a glance. Dry hours matter more than temperature here — that is
 * the number that decides whether a spray is possible — so it gets its own row.
 */
export function WeatherStrip({ wx }: { wx: WeatherWindow }) {
  return (
    <section className="overflow-x-auto">
      <div className="flex gap-2 pb-1" style={{ minWidth: "min-content" }}>
        {wx.days.map((d) => {
          const day = new Date(d.date);
          const wet = d.rainMm >= 10;
          return (
            <div
              key={d.date}
              className="w-[74px] shrink-0 rounded-xl border p-2 text-center"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <div className="text-[11px] font-medium uppercase" style={{ color: "var(--ink-soft)" }}>
                {day.toLocaleDateString("en-IN", { weekday: "short" })}
              </div>
              <div aria-hidden className="my-1 text-lg">{wet ? "🌧️" : d.rainMm > 1 ? "🌦️" : "☀️"}</div>
              <div className="text-sm font-semibold tabular-nums">{d.rainMm.toFixed(0)}mm</div>
              <div className="mt-1 text-[11px] tabular-nums" style={{ color: "var(--ink-soft)" }}>
                {d.dryHours}h dry
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
