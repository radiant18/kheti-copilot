/**
 * WhatsApp Cloud API sender.
 *
 * What this needs before it can send anything:
 *
 *  1. A Meta Business account with a WhatsApp phone number, giving you
 *     WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID.
 *  2. An APPROVED MESSAGE TEMPLATE. A business cannot start a conversation with
 *     free-form text — outside a 24-hour window opened by the customer, only a
 *     template Meta has reviewed may be sent. The 5am plan is business-initiated
 *     by definition, so it must go as a template.
 *  3. The farmer's opt-in, which is Meta policy as well as ours.
 *
 * It also costs money per conversation. None of that is something code can
 * arrange, so with no credentials configured this reports what it would have
 * sent and sends nothing. That keeps the job runnable and inspectable in
 * development without a Meta account.
 */

const API_VERSION = "v21.0";

export interface SendResult {
  phone: string;
  ok: boolean;
  /** True when nothing was sent because credentials are absent. */
  dryRun: boolean;
  detail?: string;
  /** On a dry run, exactly what would have gone out — so it can be checked. */
  preview?: string;
}

export function isConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Send the daily plan.
 *
 * `body` is passed as the single template variable, so the approved template
 * should read roughly "{{1}}" with your own header and footer around it. If
 * your template takes no variables this will fail Meta's validation — match the
 * template you actually registered.
 */
export async function sendDailyPlan(phone: string, body: string): Promise<SendResult> {
  if (!isConfigured()) {
    return {
      phone,
      ok: false,
      dryRun: true,
      detail: "WHATSAPP_TOKEN not set; nothing sent",
      preview: body,
    };
  }

  const template = process.env.WHATSAPP_TEMPLATE_NAME ?? "daily_farm_plan";
  const langCode = process.env.WHATSAPP_TEMPLATE_LANG ?? "en";

  const url = `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        // Indian numbers are stored as 10 digits; the API wants the country code.
        to: `91${phone.replace(/\D/g, "").slice(-10)}`,
        type: "template",
        template: {
          name: template,
          language: { code: langCode },
          components: [{ type: "body", parameters: [{ type: "text", text: body }] }],
        },
      }),
    });

    if (!res.ok) {
      return { phone, ok: false, dryRun: false, detail: `${res.status} ${await res.text()}` };
    }
    return { phone, ok: true, dryRun: false };
  } catch (err) {
    return { phone, ok: false, dryRun: false, detail: String(err) };
  }
}
