"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGUAGES, t, type Lang } from "@/lib/i18n";
import { isValidPhone, loadSession, signIn } from "@/lib/session";

/**
 * Sign-in.
 *
 * Language comes first, above the name and number, because everything below it
 * is written in whatever is chosen — asking someone to read English in order to
 * reach the Kannada option defeats the point. The chips show each language in
 * its own script, which is the only label a non-reader of English can use.
 *
 * See lib/session.ts: this records identity on the device and verifies nothing.
 */
export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session) router.replace(session.onboarded ? "/" : "/onboarding");
  }, [router]);

  const digits = phone.replace(/\D/g, "");
  const phoneOk = isValidPhone(digits);
  const nameOk = name.trim().length >= 2;
  const canSubmit = phoneOk && nameOk;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    const session = signIn(digits, name.trim(), lang);
    router.push(session.onboarded ? "/" : "/onboarding");
  }

  return (
    <main className="flex min-h-[100svh] flex-col justify-center py-10">
      <header className="mb-8">
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
          style={{ background: "var(--accent-soft)" }}
          aria-hidden
        >
          🌴
        </div>
        <h1 className="text-[2.6rem] font-extrabold leading-[1.05]">Kheti</h1>
        <p className="mt-3 max-w-[22rem] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {t(lang, "tagline")}
        </p>
      </header>

      <fieldset className="mb-7">
        <legend className="eyebrow mb-2.5">{t(lang, "chooseLanguage")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => {
            const on = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-pressed={on}
                className="press flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left"
                style={{
                  borderColor: on ? "var(--accent)" : "var(--line)",
                  background: on ? "var(--accent-soft)" : "var(--surface)",
                  color: on ? "var(--accent)" : "var(--ink)",
                  fontWeight: on ? 700 : 500,
                }}
              >
                <span className="text-[15px]">{l.native}</span>
                {on && <span aria-hidden className="text-sm">✓</span>}
              </button>
            );
          })}
        </div>
      </fieldset>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="eyebrow mb-1.5 block">{t(lang, "yourName")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="card w-full px-3.5 py-3"
            style={{ color: "var(--ink)" }}
          />
        </label>

        <label className="block">
          <span className="eyebrow mb-1.5 block">{t(lang, "mobile")}</span>
          <div className="card flex items-center gap-2 px-3.5">
            <span className="tabular text-[15px]" style={{ color: "var(--ink-faint)" }}>+91</span>
            <span aria-hidden style={{ color: "var(--line-strong)" }}>|</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={11}
              placeholder="98800 12345"
              className="tabular min-w-0 flex-1 bg-transparent py-3 outline-none"
              style={{ color: "var(--ink)" }}
            />
          </div>
          {touched && !phoneOk && (
            <span className="mt-1.5 block text-sm" style={{ color: "var(--urgent)" }}>
              Enter a 10-digit mobile number starting with 6, 7, 8 or 9.
            </span>
          )}
        </label>

        {touched && !nameOk && (
          <p className="text-sm" style={{ color: "var(--urgent)" }}>Enter your name.</p>
        )}

        <button
          type="submit"
          className="press w-full rounded-xl py-3.5 text-base font-bold"
          style={{
            background: canSubmit ? "var(--accent)" : "var(--surface-2)",
            color: canSubmit ? "var(--ground)" : "var(--ink-faint)",
            boxShadow: canSubmit ? "var(--shadow-md)" : "none",
          }}
        >
          {t(lang, "continue")}
        </button>
      </form>

      <p className="mt-6 text-xs leading-relaxed" style={{ color: "var(--ink-faint)" }}>
        {t(lang, "privacy")}
      </p>
    </main>
  );
}
