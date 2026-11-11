"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/use-lang";
import { currentRole, type Role } from "@/lib/session";
import { useEffect, useState } from "react";

/** Hidden during sign-in and setup — those flows own the whole screen. */
const CHROMELESS = new Set(["/login", "/onboarding"]);

/**
 * Three destinations, and only three.
 *
 * Ask moved to a floating mic (see AskFab) because it is reached *from* the
 * other screens, and Settings moved to the masthead because it is visited on
 * purpose. What is left is the sequence a farmer actually moves through in a
 * morning: what to do, what it sells for, what it earned. Each tab is now a
 * third of the bar instead of a fifth, which is the difference between a label
 * you read and a label you squint at.
 *
 * A trader has no garden to irrigate and no season to cost out, so they get no
 * bar at all — the board is their whole app, reached from the masthead.
 */
const TABS: Record<Role, { href: string; key: string; icon: string }[]> = {
  farmer: [
    { href: "/", key: "navToday", icon: "🌴" },
    { href: "/market", key: "navSell", icon: "💰" },
    { href: "/profit", key: "navProfit", icon: "📊" },
  ],
  buyer: [],
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
  if (tabs.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t"
      style={{
        background: "color-mix(in srgb, var(--ground) 88%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--line)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto flex max-w-[30rem] gap-1 px-3 py-2">
        {tabs.map((tab) => {
          const active = path === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                /* A filled pill, not a tinted label. On a white ground a colour
                   change alone is too quiet to find at a glance in sunlight. */
                className="press flex flex-col items-center gap-1 rounded-2xl py-2"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "var(--ground)" : "var(--ink-faint)",
                }}
              >
                <span aria-hidden className="text-[19px] leading-none">{tab.icon}</span>
                <span
                  className="text-[11px] leading-none"
                  style={{ fontWeight: active ? 800 : 600 }}
                >
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
