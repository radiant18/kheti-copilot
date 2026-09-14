// Same shape as the WhatsApp sender's result, deliberately: both answer the
// one question the caller has — did a message reach this number, and if not,
// was that because nothing is configured or because the send failed.
import type { SendResult } from "./whatsapp";

/**
 * Login codes by SMS.
 *
 * SMS rather than WhatsApp for the code itself: it needs no app installed, it
 * arrives on a feature phone, and Android reads it straight into the code box
 * from the notification — a farmer at dawn in a field should not be switching
 * apps and copying digits across. WhatsApp stays the channel for the 5am plan,
 * which is a long message to somebody who opted in, and remains the fallback
 * here when no SMS provider is configured.
 *
 * WHAT INDIA REQUIRES: a transactional SMS to an Indian number has to go out
 * under a DLT registration — a registered sender header (six letters, e.g.
 * KHETIA) and a template whose exact wording TRAI has approved, with the code
 * as a variable. That registration is paperwork against a business entity, not
 * something code can arrange, so with no credentials this sends nothing and
 * says so. Get the header and template approved on the provider's DLT console
 * before expecting a single message to land.
 *
 * Two providers, because which one you can get an account with is not a code
 * decision: MSG91, the usual Indian choice, whose flow API takes the variable
 * and fills the approved template; and Twilio, which works anywhere and is the
 * easier one to test with. Both are a single HTTP POST. Set SMS_PROVIDER, or
 * leave it and whichever set of credentials is present wins.
 */

export type Provider = "msg91" | "twilio";

export function provider(): Provider | null {
  const named = process.env.SMS_PROVIDER?.toLowerCase();
  if (named === "msg91" || named === "twilio") return named;
  // Unnamed: infer from what is actually configured, so a deployment that sets
  // only one provider's keys does not also have to say which one it set.
  if (process.env.MSG91_AUTH_KEY) return "msg91";
  if (process.env.TWILIO_ACCOUNT_SID) return "twilio";
  return null;
}

export function isConfigured(): boolean {
  const which = provider();
  if (which === "msg91") {
    return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
  }
  if (which === "twilio") {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM,
    );
  }
  return false;
}

/** Indian numbers are stored as 10 digits; both APIs want the country code. */
const withCountryCode = (phone: string): string => `91${phone.replace(/\D/g, "").slice(-10)}`;

/**
 * MSG91's flow API. The wording lives in the DLT-approved template; all this
 * sends is the variable, which is why there is no message text here to edit.
 */
async function sendViaMsg91(phone: string, code: string): Promise<SendResult> {
  const variable = process.env.MSG91_VAR_NAME ?? "OTP";

  const res = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      authkey: process.env.MSG91_AUTH_KEY as string,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      ...(process.env.MSG91_SENDER_ID ? { sender: process.env.MSG91_SENDER_ID } : {}),
      short_url: "0",
      recipients: [{ mobiles: withCountryCode(phone), [variable]: code }],
    }),
  });

  const detail = await res.text();
  // MSG91 answers 200 with {"type":"error"} for a rejected template or a
  // number on the DND registry, so the status alone does not mean it went.
  if (!res.ok || detail.includes('"type":"error"')) {
    return { phone, ok: false, dryRun: false, detail: `${res.status} ${detail}` };
  }
  return { phone, ok: true, dryRun: false };
}

async function sendViaTwilio(phone: string, code: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID as string;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: `+${withCountryCode(phone)}`,
      From: process.env.TWILIO_FROM as string,
      // Must match the DLT-approved wording character for character when the
      // destination is an Indian number.
      Body: `${code} is your Kheti sign-in code. It is valid for 5 minutes. Do not share it with anyone.`,
    }),
  });

  if (!res.ok) {
    return { phone, ok: false, dryRun: false, detail: `${res.status} ${await res.text()}` };
  }
  return { phone, ok: true, dryRun: false };
}

export async function sendLoginCode(phone: string, code: string): Promise<SendResult> {
  if (!isConfigured()) {
    return {
      phone,
      ok: false,
      dryRun: true,
      detail: "No SMS provider configured; nothing sent",
      preview: code,
    };
  }

  try {
    return provider() === "twilio" ? await sendViaTwilio(phone, code) : await sendViaMsg91(phone, code);
  } catch (err) {
    return { phone, ok: false, dryRun: false, detail: String(err) };
  }
}
