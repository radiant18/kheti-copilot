"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { apiPost } from "@/lib/api";
import { buildAskContext } from "@/lib/ask-context";
import { getCrop } from "@/lib/crops";
import { loadFarm } from "@/lib/farm";
import { listenOnce, speak, speechSupported, stopSpeaking, type Listener } from "@/lib/speech";
import { usePlan } from "@/lib/use-plan";
import { useLang } from "@/lib/use-lang";
import type { Farm } from "@/lib/types";

interface Turn {
  role: "user" | "assistant";
  text: string;
}

/**
 * "Ask your farm".
 *
 * The microphone is the primary control and the text box sits beside it, not
 * behind it — browser Kannada recognition fails often enough that hiding the
 * keyboard would strand people. Answers are spoken automatically because the
 * farmer may be holding the phone at arm's length with wet hands.
 */
export default function AskPage() {
  const { plan } = usePlan();
  const [farm, setFarm] = useState<Farm | null>(null);
  const { lang, t } = useLang();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listenerRef = useRef<Listener | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setFarm(loadFarm()), []);
  // Braced deliberately: scrollIntoView resolves a Promise in newer Chrome, and
  // a concise body would hand that Promise back to React as the cleanup.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, thinking]);
  useEffect(() => () => stopSpeaking(), []);

  const crop = farm ? getCrop(farm.cropId) : null;

  async function ask(question: string) {
    if (!farm || !plan || thinking) return;
    stopSpeaking();
    setNotice(null);
    setTyped("");
    const history = turns.slice(-4);
    setTurns((t) => [...t, { role: "user", text: question }]);
    setThinking(true);

    try {
      const { answer } = await apiPost<{ answer: string }>("/api/ask", {
        question,
        lang,
        context: buildAskContext(farm, plan),
        history,
      });
      setTurns((t) => [...t, { role: "assistant", text: answer }]);
      speak(answer, lang);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "assistant", text: "I could not reach the assistant. Your farm plan on the other screens still works." },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function toggleMic() {
    if (listening) {
      listenerRef.current?.stop();
      setListening(false);
      return;
    }
    setNotice(null);
    setListening(true);
    listenerRef.current = listenOnce(
      lang,
      (text) => { setListening(false); void ask(text); },
      (message) => { setListening(false); setNotice(message); },
    );
    if (!listenerRef.current) setListening(false);
  }

  // Suggestions come from the plan, so tapping one always has a real answer.
  const suggestions = plan
    ? [
        "Can I spray today?",
        plan.economics.bearing ? "Should I sell now?" : "When will my crop be ready?",
        "Do I need to water today?",
      ]
    : [];

  return (
    <main className="flex min-h-[calc(100svh-12rem)] flex-col py-4">
      <PageHeader
        title={t("askYourFarm")}
        subtitle={
          crop
            ? `About your ${crop.name.en.toLowerCase()} at ${farm?.village || "your farm"}.`
            : "Loading your farm…"
        }
      />

      {turns.length === 0 && (
        <div className="card mb-4 p-5">
          <p className="t-body">
            Ask about today&apos;s weather, spraying, watering, or prices. I only answer from
            your own farm&apos;s plan — if I do not know, I will say so.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => void ask(q)}
                className="press rounded-full px-4 py-2 text-[14px] font-bold"
                style={{ background: "var(--accent-soft)", color: "var(--accent-ink)" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3">
        {turns.map((t, i) => (
          <div
            key={i}
            className="rounded-[20px] px-4 py-3.5"
            style={
              t.role === "user"
                ? { background: "var(--accent)", color: "var(--ground)", marginLeft: "2rem" }
                : { background: "var(--surface-2)", marginRight: "1rem" }
            }
          >
            <p className="text-[16px] leading-relaxed">{t.text}</p>
            {t.role === "assistant" && (
              <button
                onClick={() => speak(t.text, lang)}
                className="mt-2.5 text-[13px] font-bold"
                style={{ color: "var(--accent-ink)" }}
              >
                🔊 Say it again
              </button>
            )}
          </div>
        ))}

        {thinking && (
          <p className="px-4 text-sm" style={{ color: "var(--ink-soft)" }}>Thinking…</p>
        )}
        <div ref={endRef} />
      </div>

      {notice && (
        <p className="mt-3 text-sm" style={{ color: "var(--urgent)" }}>{notice}</p>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); if (typed.trim()) void ask(typed.trim()); }}
        className="sticky mt-4 flex gap-2 pb-2 pt-2"
        style={{
          background: "var(--ground)",
          /* Clears the tab bar; the mic here replaces the floating one, which
             AskFab hides on this screen. */
          bottom: "calc(4.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={toggleMic}
          aria-label={listening ? "Stop listening" : "Ask by voice"}
          className="press flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[22px]"
          style={{
            background: listening ? "var(--urgent)" : "var(--accent)",
            color: "var(--ground)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {listening ? "■" : "🎤"}
        </button>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={listening ? "…" : t("askPlaceholder")}
          className="min-w-0 flex-1 rounded-2xl border px-4 text-base"
          style={{ borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--ink)" }}
        />
        <button
          type="submit"
          disabled={!typed.trim() || thinking}
          className="press rounded-2xl px-5 font-extrabold"
          style={{
            background: typed.trim() ? "var(--accent)" : "var(--line)",
            color: typed.trim() ? "var(--ground)" : "var(--ink-soft)",
          }}
        >
          {t("ask")}
        </button>
      </form>

      {!speechSupported() && (
        <p className="mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>
          This phone cannot listen — type your question instead.
        </p>
      )}
    </main>
  );
}
