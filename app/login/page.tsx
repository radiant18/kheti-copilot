"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiSend } from "@/lib/api";
import { LANGUAGES, t, type Lang } from "@/lib/i18n";
import { isValidPhone, loadSession, signIn, startDemo, type Role } from "@/lib/session";

/**
 * Sign-in.
 *
 * Language comes first, above the name and number, because everything below it
 * is written in whatever is chosen — asking someone to read English in order to
 * reach the Kannada option defeats the point. The chips show each language in
 * its own script, which is the only label a non-reader of English can use.
 *
 * Two steps, because the number has to be proved and not merely typed. A lot on
 * the direct board publishes a phone number to every buyer in the state, and
 * that should take the owner of the number, not anybody who knows it — so the
 * code goes out here, once, and the token it earns is what the publishing
 * routes trust from then on. See lib/otp.ts.
 *
 * Somebody returning to change their language is not asked again: the number
 * they already proved is the same number.
 */

type Channel = "sms" | "whatsapp" | "dev";

interface OtpReply {
  ok?: boolean;
  sent?: Channel;
  code?: string;
  token?: string;
  error?: string;
  retryInSec?: number;
}

/** Server reasons, mapped to something a farmer can act on. */
const REASON: Record<string, string> = {
  wrong: "codeWrong",
  expired: "codeExpired",
  too_many: "codeTooMany",
  bad_request: "codeWrong",
  send_failed: "codeSendFailed",
  delivery_not_configured: "codeNotConfigured",
  no_signing_key: "codeNotConfigured",
};

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const [role, setRole] = useState<Role>("farmer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const [step, setStep] = useState<"details" | "code">("details");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Shown only when the server had no way to send it — development. */
  const [devCode, setDevCode] = useState<string | null>(null);
  /** Which way it actually went, so the screen names the right inbox. */
  const [channel, setChannel] = useState<Channel>("sms");
  const [cooldown, setCooldown] = useState(0);
  /** The number this device has already proved, if any. */
  const [proved, setProved] = useState<{ phone: string; proof: string } | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    // Arriving here from the setup wizard's Back is deliberate: the farmer
    // wants to change something they chose on this screen, usually the
    // language. Prefill what they picked and stay put instead of bouncing them
    // straight back, which is what made the choice feel permanent.
    // Read from location rather than useSearchParams: this page is statically
    // rendered and the hook would demand a Suspense boundary around it.
    if (new URLSearchParams(window.location.search).has("change")) {
      setLang(session.lang);
      setRole(session.role ?? "farmer");
      setName(session.name);
      setPhone(session.phone);
      if (session.proof) setProved({ phone: session.phone, proof: session.proof });
      return;
    }

    router.replace(session.onboarded ? "/" : "/onboarding");
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const digits = phone.replace(/\D/g, "");
  const phoneOk = isValidPhone(digits);
  const nameOk = name.trim().length >= 2;
  const canSubmit = phoneOk && nameOk && !busy;

  function finish(proof?: string) {
    const session = signIn(digits, name.trim(), lang, role, proof);
    // A buyer has no farm to set up; send them straight to the board.
    router.push(role === "buyer" ? "/market" : session.onboarded ? "/" : "/onboarding");
  }

  async function requestCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiSend<OtpReply>("/api/otp", "POST", { phone: digits });

      // 429 means a code went out moments ago and is still good — the farmer
      // should be typing it, not asking for another.
      if (res.status === 429) {
        setStep("code");
        setCooldown(res.data?.retryInSec ?? 60);
        return;
      }
      if (!res.ok || !res.data?.ok) {
        setError(REASON[res.data?.error ?? ""] ?? "codeSendFailed");
        return;
      }

      setStep("code");
      setCode("");
      setChannel(res.data.sent ?? "sms");
      setDevCode(res.data.sent === "dev" ? res.data.code ?? null : null);
      setCooldown(60);
    } finally {
      setBusy(false);
    }
  }

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    // Nothing to prove twice: this device already answered a code for this
    // number, and they are only here to change a language or a name.
    if (proved && proved.phone === digits) {
      finish(proved.proof);
      return;
    }
    void requestCode();
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.replace(/\D/g, "").length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiSend<OtpReply>("/api/otp/verify", "POST", {
        phone: digits,
        code: code.replace(/\D/g, ""),
      });
      if (res.ok && res.data?.token) {
        finish(res.data.token);
        return;
      }
      setError(REASON[res.data?.error ?? ""] ?? "codeWrong");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  const primary = (enabled: boolean) => ({
    background: enabled ? "var(--accent)" : "var(--surface-2)",
    color: enabled ? "var(--ground)" : "var(--ink-faint)",
    boxShadow: enabled ? "var(--shadow-md)" : "none",
  });

  if (step === "code") {
    const codeOk = code.replace(/\D/g, "").length === 6;
    return (
      <main className="flex min-h-[100svh] flex-col justify-center py-10">
        <header className="mb-8">
          <div
            className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
            style={{ background: "var(--accent-soft)" }}
            aria-hidden
          >
            💬
          </div>
          <h1 className="text-[2rem] font-extrabold leading-tight">{t(lang, "codeTitle")}</h1>
          <p className="mt-3 max-w-[22rem] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {channel === "dev"
              ? t(lang, "codeNotSent")
              : t(lang, channel === "whatsapp" ? "codeSentTo" : "codeSentToSms", {
                  phone: digits,
                })}
          </p>
        </header>

        <form onSubmit={submitCode} className="space-y-4">
          <label className="block">
            <span className="eyebrow mb-1.5 block">{t(lang, "codeLabel")}</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              placeholder="000000"
              className="card tabular w-full px-3.5 py-3 text-center text-[1.6rem] font-bold tracking-[0.4em]"
              style={{ color: "var(--ink)" }}
            />
          </label>

          {error && (
            <p className="text-sm" style={{ color: "var(--urgent)" }}>{t(lang, error)}</p>
          )}

          {/* No SMS provider and no WhatsApp on this server, so nothing was
              actually sent. The route only ever does this outside production. */}
          {devCode && (
            <p
              className="rounded-lg px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--signal-soft)", color: "var(--signal)" }}
            >
              {t(lang, "codeDevNotice", { code: devCode })}
            </p>
          )}

          <button
            type="submit"
            disabled={!codeOk || busy}
            className="press w-full rounded-xl py-3.5 text-base font-bold"
            style={primary(codeOk && !busy)}
          >
            {t(lang, "verifyAndContinue")}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("details");
              setError(null);
              setDevCode(null);
            }}
            className="font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {t(lang, "changeNumber")}
          </button>
          <button
            type="button"
            onClick={() => void requestCode()}
            disabled={cooldown > 0 || busy}
            className="font-semibold"
            style={{ color: cooldown > 0 ? "var(--ink-faint)" : "var(--accent)" }}
          >
            {cooldown > 0 ? t(lang, "resendIn", { sec: cooldown }) : t(lang, "resendCode")}
          </button>
        </div>
      </main>
    );
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
        <legend className="eyebrow mb-2.5">{t(lang, "chooseRole")}</legend>
        <div className="grid gap-2">
          {(
            [
              ["farmer", "roleFarmer", "roleFarmerNote"],
              ["buyer", "roleBuyer", "roleBuyerNote"],
            ] as const
          ).map(([value, label, note]) => {
            const on = role === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={on}
                className="press rounded-xl border px-4 py-3 text-left"
                style={{
                  borderColor: on ? "var(--accent)" : "var(--line)",
                  background: on ? "var(--accent-soft)" : "var(--surface)",
                }}
              >
                <span className="block font-bold" style={{ color: on ? "var(--accent)" : "var(--ink)" }}>
                  {t(lang, label)}
                </span>
                <span className="mt-0.5 block text-sm" style={{ color: "var(--ink-soft)" }}>
                  {t(lang, note)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

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

      <form onSubmit={submitDetails} className="space-y-4">
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

        {error && <p className="text-sm" style={{ color: "var(--urgent)" }}>{t(lang, error)}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="press w-full rounded-xl py-3.5 text-base font-bold"
          style={primary(canSubmit)}
        >
          {proved && proved.phone === digits ? t(lang, "continue") : t(lang, "sendCode")}
        </button>
      </form>

      <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        {t(lang, "whyVerify")}
      </p>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--ink-faint)" }}>
        {t(lang, "privacy")}
      </p>

      {/* Someone opening this for the first time should be able to see what it
          does before handing over a phone number. Judges, extension officers and
          a farmer's curious son all arrive the same way. */}
      <div className="mt-7 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        <span className="eyebrow">{t(lang, "orDivider")}</span>
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
      </div>

      <button
        type="button"
        onClick={() => {
          startDemo(lang, role);
          router.push(role === "buyer" ? "/market" : "/");
        }}
        className="press card mt-4 w-full py-3.5 text-base font-bold"
        style={{ color: "var(--accent)" }}
      >
        {t(lang, "tryDemo")}
      </button>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--ink-faint)" }}>
        {t(lang, "tryDemoNote")}
      </p>
    </main>
  );
}
