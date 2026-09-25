import { NextResponse } from "next/server";
import { isConfigured as signingConfigured, issueCode } from "@/lib/otp";
import { isValidPhone } from "@/lib/session-shared";
import { isConfigured as smsConfigured, sendLoginCode } from "@/lib/sms";
import { isConfigured as whatsappConfigured, sendOtp } from "@/lib/whatsapp";

/**
 * Step one of proving a number: send six digits to it.
 *
 * SMS first, because that is the one channel that needs nothing installed and
 * that the phone itself will read into the code box. WhatsApp is the fallback
 * for a deployment that has a Meta account but no DLT registration yet, since
 * a code arriving somehow beats a sign-in screen that cannot be passed.
 *
 * The code never comes back to the caller in production. Returning it would
 * make the whole exercise decorative — anyone could ask for a code for a
 * stranger's number, read it out of the response and go on to publish that
 * number. In development, where there is no provider to hand, the dry run does
 * show it, so the flow can be walked end to end.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").replace(/\D/g, "");
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "bad_phone" }, { status: 400 });
  }

  if (!signingConfigured()) {
    return NextResponse.json({ error: "no_signing_key" }, { status: 503 });
  }

  const bySms = smsConfigured();
  const byWhatsapp = !bySms && whatsappConfigured();
  const dev = process.env.NODE_ENV !== "production";

  if (!bySms && !byWhatsapp && !dev) {
    // Nothing can carry the code to the farmer, and we will not hand it back
    // over the wire instead. Better to say so than to pretend it was sent.
    return NextResponse.json({ error: "delivery_not_configured" }, { status: 503 });
  }

  const issued = issueCode(phone);
  if (!issued.ok) {
    return NextResponse.json(
      { error: "too_soon", retryInSec: issued.retryInSec },
      { status: 429 },
    );
  }

  const result = bySms
    ? await sendLoginCode(phone, issued.code)
    : await sendOtp(phone, issued.code);

  if (result.dryRun) {
    return NextResponse.json({ ok: true, sent: "dev", code: issued.code });
  }
  if (!result.ok) {
    return NextResponse.json({ error: "send_failed", detail: result.detail }, { status: 502 });
  }
  return NextResponse.json({ ok: true, sent: bySms ? "sms" : "whatsapp" });
}
