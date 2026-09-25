"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { currentRole, type Role } from "@/lib/session";
import { useLang } from "@/lib/use-lang";

/** Hidden during sign-in and setup — those flows own the whole screen. */
const CHROMELESS = new Set(["/login", "/onboarding"]);

/**
 * Ask, lifted out of the tab bar.
 *
 * Asking a question is the one thing a farmer may want to do *from* another
 * screen — you read the price, then you want to know whether to sell. As a tab
 * it competed for a fifth of the bar with screens you visit in sequence; as a
 * mic it sits above all of them and is reachable with the thumb that is already
 * holding the phone.
 *
 * A buyer has no farm to ask about, so they do not get one.
 */
export function AskFab() {
  const path = usePathname();
  const { t } = useLang();
  const [role, setRole] = useState<Role>("farmer");

  useEffect(() => setRole(currentRole()), [path]);

  if (CHROMELESS.has(path) || path === "/ask" || role === "buyer") return null;

  return (
    <Link
      href="/ask"
      aria-label={t("navAsk")}
      className="press fixed z-30 flex h-14 w-14 items-center justify-center rounded-full text-[22px]"
      style={{
        bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
        /* Hugs the content column, not the window. The shell is capped at
           30rem and centred, so on anything wider than a phone a plain
           `right: 1.25rem` would strand the mic out in the margin. */
        right: "max(1.25rem, calc(50vw - 15rem + 1.25rem))",
        background: "var(--accent)",
        color: "var(--ground)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <span aria-hidden>🎤</span>
    </Link>
  );
}
