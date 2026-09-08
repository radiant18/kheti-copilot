"use client";

/**
 * Voice in and out, using what the phone already has.
 *
 * The browser's own speech engine costs nothing, needs no key, and works inside
 * the Capacitor Android shell. Its Kannada recognition is decent on a good
 * connection and poor on a bad one, which is why typing is always available
 * beside the microphone rather than behind it.
 *
 * The production path is Bhashini (free at low volume, 22 Indian languages) or
 * AI4Bharat's IndicASR self-hosted — both handle Kannada and Tulu-accented
 * speech far better than the browser. Swap them in behind these two functions;
 * nothing else in the app touches speech.
 */

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function recogniser(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function speechSupported(): boolean {
  return recogniser() !== null;
}

export interface Listener {
  stop: () => void;
}

/**
 * Listen for one utterance. Returns a handle so the UI can cancel — a farmer
 * who taps the mic by accident should not be stuck waiting for a timeout.
 */
export function listenOnce(
  lang: "kn" | "en",
  onResult: (text: string) => void,
  onError: (message: string) => void,
): Listener | null {
  const rec = recogniser();
  if (!rec) {
    onError("This phone cannot listen. Type your question instead.");
    return null;
  }

  rec.lang = lang === "kn" ? "kn-IN" : "en-IN";
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript ?? "";
    if (text.trim()) onResult(text.trim());
    else onError("I did not catch that. Try again, or type it.");
  };

  rec.onerror = (e) => {
    onError(
      e.error === "not-allowed"
        ? "Microphone permission was refused. Type your question instead."
        : e.error === "no-speech"
          ? "I did not hear anything. Try again."
          : "Listening failed. Type your question instead.",
    );
  };

  try {
    rec.start();
  } catch {
    onError("Could not start listening. Type your question instead.");
    return null;
  }

  return { stop: () => { try { rec.stop(); } catch { /* already stopped */ } } };
}

/** Read an answer aloud, if the phone has a voice for the language. */
export function speak(text: string, lang: "kn" | "en"): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const wanted = lang === "kn" ? "kn-IN" : "en-IN";
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang === wanted);
    if (voice) utter.voice = voice;
    utter.lang = wanted;
    // Slightly slow: this is spoken over field noise to someone who may be
    // hearing the app's voice for the first time.
    utter.rate = 0.92;
    window.speechSynthesis.speak(utter);
  } catch {
    // No voice available — the answer is on screen regardless.
  }
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* nothing to stop */
  }
}
