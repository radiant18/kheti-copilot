"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isValidPhone, loadSession, signIn } from "@/lib/session";

/**
 * Sign-in.
 *
 * Deliberately two fields and no password — the target user is a farmer on a
 * ₹7,000 Android phone, and every extra field loses people. See lib/session.ts:
 * this records identity locally and does not yet verify anything.
 */
export default function LoginPage() {
  const router = useRouter();
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
    const session = signIn(digits, name.trim());
    router.push(session.onboarded ? "/" : "/onboarding");
  }

  return (
    <main className="flex min-h-[100svh] flex-col justify-center py-10">
      <div className="mb-9">
        <span aria-hidden className="text-4xl">🌴</span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Kheti</h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--ink-soft)" }}>
          Your farm&apos;s daily plan — what to water, what to spray, and where to sell.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
            Your name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Suresh Bhat"
            className="w-full rounded-xl border px-3 text-base"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--ink)" }}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
            Mobile number
          </span>
          <div
            className="flex items-center gap-2 rounded-xl border px-3"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <span className="text-base tabular-nums" style={{ color: "var(--ink-soft)" }}>+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={11}
              placeholder="98800 12345"
              className="min-w-0 flex-1 bg-transparent text-base tabular-nums outline-none"
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
          className="w-full rounded-xl px-4 py-3.5 text-base font-semibold"
          style={{
            background: canSubmit ? "var(--accent)" : "var(--border)",
            color: canSubmit ? "var(--bg)" : "var(--ink-soft)",
          }}
        >
          Continue
        </button>
      </form>

      <p className="mt-6 text-xs leading-relaxed" style={{ color: "var(--ink-soft)" }}>
        Your number stays on this phone. It is not sent anywhere yet — OTP verification
        arrives with the backend.
      </p>
    </main>
  );
}
