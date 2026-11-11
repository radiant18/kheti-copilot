"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { currentRole, loadSession, type Role } from "@/lib/session";
import { useLang } from "@/lib/use-lang";

/** Hidden during sign-in and setup — those flows own the whole screen. */
const CHROMELESS = new Set(["/login", "/onboarding"]);

/**
 * The masthead.
 *
 * Settings used to be a tab, which gave a screen people open twice a year the
 * same weight as the one they open every morning. It lives up here instead, as
 * the farmer's own initial — a destination you go to on purpose, not one you
 * land on by mis-tapping the bottom of the screen.
 *
 * Sticky rather than fixed: it scrolls with a long Market list instead of
 * eating 56px of a phone screen permanently, but snaps back the moment you
 * scroll up.
 */
export function AppHeader() {
  const path = usePathname();
  const { t } = useLang();
  const [initial, setInitial] = useState("");
  const [role, setRole] = useState<Role>("farmer");

  // localStorage is invisible to the server render, so the initial arrives on
  // mount. The circle keeps its size meanwhile and simply fills in.
  useEffect(() => {
    const name = loadSession()?.name?.trim() ?? "";
    setInitial(name ? name[0].toUpperCase() : "");
    setRole(currentRole());
  }, [path]);

  if (CHROMELESS.has(path)) return null;
  const onSettings = path === "/settings";
  // A buyer has no Today screen; AppGate would only bounce them off it.
  const home = role === "buyer" ? "/market" : "/";

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: "color-mix(in srgb, var(--ground) 85%, transparent)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="mx-auto flex h-14 w-full max-w-[30rem] items-center justify-between px-5">
        <Link href={home} className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[15px]"
            style={{ background: "var(--accent-soft)" }}
          >
            🌴
          </span>
          <span className="text-[17px] font-extrabold tracking-[-0.03em]">Kheti</span>
        </Link>

        <Link
          href="/settings"
          aria-label={t("navSettings")}
          aria-current={onSettings ? "page" : undefined}
          className="press flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-extrabold"
          style={{
            background: onSettings ? "var(--accent)" : "var(--surface-2)",
            color: onSettings ? "var(--ground)" : "var(--ink-soft)",
            border: `1px solid ${onSettings ? "var(--accent)" : "var(--line)"}`,
          }}
        >
          {initial || "⚙"}
        </Link>
      </div>
    </header>
  );
}
