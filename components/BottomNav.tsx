"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Today", icon: "🌴" },
  { href: "/market", label: "Sell", icon: "💰" },
  { href: "/profit", label: "Profit", icon: "📊" },
  { href: "/ask", label: "Ask", icon: "🎤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

/** Hidden during sign-in and setup — those flows own the whole screen. */
const CHROMELESS = new Set(["/login", "/onboarding"]);

export function BottomNav() {
  const path = usePathname();
  if (CHROMELESS.has(path)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const active = path === t.href;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium"
                style={{ color: active ? "var(--accent)" : "var(--ink-soft)" }}
              >
                <span aria-hidden className="text-xl">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
