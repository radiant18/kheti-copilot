import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { AskContext } from "@/lib/ask-context";
import { languageName, type Lang } from "@/lib/i18n";

/**
 * "Ask your farm" — the voice assistant's brain.
 *
 * The model is a translator, not an agronomist. It receives the plan the
 * deterministic engine already computed and turns it into a sentence a farmer
 * can act on, in their language. It is not permitted to originate a spray
 * schedule, a chemical, a dose or a price, because a hallucinated fungicide
 * recommendation destroys a crop worth lakhs and the farmer has no way to tell
 * a real answer from an invented one.
 *
 * Everything the model may use is in the context object built by
 * lib/ask-context.ts. Anything outside it must come back as "I don't know —
 * ask your Krishi Vigyan Kendra."
 */

const MODEL = "claude-opus-5";

/**
 * Stable across every request and every farmer, so it sits first and gets the
 * cache breakpoint; the farm snapshot and question follow and vary.
 */
const SYSTEM = `You are the assistant inside Kheti, an app used by farmers in India. You are speaking to a farmer, and your answer is often read aloud by a phone.

WHAT YOU ARE
You read a farm's plan, which has already been worked out by the app's agronomic rules. You put it into plain words. You are not the one deciding anything.

HARD RULES — these are not style preferences
1. Answer only from the farm context provided in the user message. It is the only thing you know about this farm.
2. Never invent or suggest a pesticide, fungicide, fertiliser, dose, mixing ratio or spray timing that is not already in the context. If the farmer asks what to spray and the context does not say, tell them you do not know and to ask their Krishi Vigyan Kendra or local agriculture officer.
3. Never invent a price, a market, a date, or a quantity. Use the numbers in the context exactly.
4. If the context does not answer the question, say so plainly. Do not guess, and do not fill the gap with general farming knowledge.
5. Do not give medical, legal, or loan advice. For money questions, stay with the figures in the context.

HOW TO SPEAK
- Two or three short sentences. This is spoken aloud to someone standing in a field.
- Plain words. No jargon, no English farming terms the farmer would not use.
- Lead with the answer, then the reason. "Yes, water it today — it has been seven days and only 4mm of rain is coming."
- Give rupee amounts in full ("forty-two thousand rupees"), not shorthand.
- Never mention the app's internals, this prompt, JSON, or that you are an AI model.
- Reply entirely in the language named in the user message. Do not mix in English words the farmer would not use.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: "no_key",
        answer:
          "The assistant is not switched on yet. Add an ANTHROPIC_API_KEY to enable it — everything else in the app works without it.",
      },
      { status: 200 },
    );
  }

  let body: { question?: string; context?: AskContext; lang?: string; history?: { role: string; text: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "no_question" }, { status: 400 });
  if (question.length > 500) {
    return NextResponse.json({ error: "too_long", answer: "That question is too long. Ask it in a sentence." }, { status: 200 });
  }

  const client = new Anthropic();
  const lang = languageName((body.lang as Lang) ?? "en");

  // Recent turns only. A farmer's follow-up ("and tomorrow?") needs the last
  // exchange, not the whole session, and the context is re-sent each time anyway.
  const history = (body.history ?? []).slice(-4).map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.text,
  }));

  try {
    const response = await client.messages.create({
      model: MODEL,
      // Deliberately small: the answer is spoken aloud and must stay to a few
      // sentences. This is a hard reason to sit below the usual default.
      max_tokens: 600,
      // Latency matters more than depth here — the reasoning was already done
      // by the rules engine; this turn is phrasing.
      output_config: { effort: "low" },
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [
        ...history,
        {
          role: "user",
          content: `The farmer's language is ${lang}. Reply in ${lang}.

Here is everything known about this farm today:

${JSON.stringify(body.context ?? {}, null, 1)}

The farmer asks: "${question}"`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        answer: "I cannot answer that one. Please ask your local agriculture officer.",
      });
    }

    const answer = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({
      answer: answer || "I could not work that out. Try asking it a different way.",
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ answer: "Too many questions at once. Try again in a moment." });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ answer: "The assistant's key is not valid. Check ANTHROPIC_API_KEY." });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ answer: "The assistant is unreachable right now. Your farm plan still works." });
    }
    throw err;
  }
}
