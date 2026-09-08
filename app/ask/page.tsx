"use client";

import { useEffect, useRef, useState } from "react";
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
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [turns, thinking]);
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
    <main className="flex min-h-[calc(100svh-5rem)] flex-col py-5">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("askYourFarm")}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-soft)" }}>
          {crop ? `About your ${crop.name.en.toLowerCase()} at ${farm?.village || "your farm"}.` : "Loading your farm…"}
        </p>
      </header>

      {turns.length === 0 && (
        <div
          className="mb-4 rounded-2xl border p-4"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Ask about today&apos;s weather, spraying, watering, or prices. I only answer from
            your own farm&apos;s plan — if I do not know, I will say so.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => void ask(q)}
                className="rounded-full border px-3 py-1.5 text-sm"
                style={{ borderColor: "var(--line)", color: "var(--accent)" }}
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
            className="rounded-2xl px-4 py-3"
            style={
              t.role === "user"
                ? { background: "var(--accent-soft)", marginLeft: "2rem" }
                : { background: "var(--surface)", border: "1px solid var(--line)", marginRight: "1rem" }
            }
          >
            <p className="text-[15px] leading-relaxed">{t.text}</p>
            {t.role === "assistant" && (
              <button
                onClick={() => speak(t.text, lang)}
                className="mt-2 text-xs font-semibold"
                style={{ color: "var(--accent)" }}
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
        className="sticky bottom-0 mt-4 flex gap-2 pb-1"
        style={{ background: "var(--ground)" }}
      >
        <button
          type="button"
          onClick={toggleMic}
          aria-label={listening ? "Stop listening" : "Ask by voice"}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl"
          style={{
            background: listening ? "var(--urgent)" : "var(--accent)",
            color: "var(--ground)",
          }}
        >
          {listening ? "■" : "🎤"}
        </button>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={listening ? "…" : t("askPlaceholder")}
          className="min-w-0 flex-1 rounded-xl border px-3 text-base"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--ink)" }}
        />
        <button
          type="submit"
          disabled={!typed.trim() || thinking}
          className="rounded-xl px-4 font-semibold"
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
