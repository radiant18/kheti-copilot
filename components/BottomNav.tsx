"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/use-lang";
import { currentRole, type Role } from "@/lib/session";
import { useEffect, useState } from "react";

/** Hidden during sign-in and setup — those flows own the whole screen. */
const CHROMELESS = new Set(["/login", "/onboarding"]);

/**
 * The app a buyer gets is a different app.
 *
 * A trader has no garden to irrigate and no season to cost out, so showing them
 * Today, Profit and Ask would be five tabs of which three are noise. They get
 * the board and their settings.
 */
const TABS: Record<Role, { href: string; key: string; icon: string }[]> = {
  farmer: [
    { href: "/", key: "navToday", icon: "🌴" },
    { href: "/market", key: "navSell", icon: "💰" },
    { href: "/profit", key: "navProfit", icon: "📊" },
    { href: "/ask", key: "navAsk", icon: "🎤" },
    { href: "/settings", key: "navSettings", icon: "⚙️" },
  ],
  buyer: [
    { href: "/market/direct", key: "navBuy", icon: "🤝" },
    { href: "/settings", key: "navSettings", icon: "⚙️" },
  ],
};

export function BottomNav() {
  const path = usePathname();
  const { t } = useLang();
  const [role, setRole] = useState<Role>("farmer");

  // Read after mount: the session lives in localStorage, which the server
  // render cannot see, and guessing would flash the wrong set of tabs.
  useEffect(() => setRole(currentRole()), [path]);

  if (CHROMELESS.has(path)) return null;
  const tabs = TABS[role];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur"
      style={{
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        borderColor: "var(--line)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto flex max-w-[30rem] px-2">
        {tabs.map((tab) => {
          const active = path === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="press relative flex flex-col items-center gap-1 py-2.5"
                style={{ color: active ? "var(--accent)" : "var(--ink-faint)" }}
              >
                {/* A short bar reads as "you are here" faster than colour alone. */}
                <span
                  aria-hidden
                  className="absolute top-0 h-[3px] w-8 rounded-b-full"
                  style={{ background: active ? "var(--accent)" : "transparent" }}
                />
                <span aria-hidden className="text-[19px] leading-none">{tab.icon}</span>
                <span className="text-[11px]" style={{ fontWeight: active ? 700 : 500 }}>
                  {t(tab.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
