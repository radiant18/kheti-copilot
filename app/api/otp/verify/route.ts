import { NextResponse } from "next/server";
import { checkCode, isConfigured, mintProof } from "@/lib/otp";
import { isValidPhone } from "@/lib/session-shared";

/**
 * Step two: the typed code buys a signed token naming the number.
 *
 * The token is what every publishing route trusts from here on. It goes to the
 * app, which keeps it with the session and sends it back as a bearer token.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").replace(/\D/g, "");
  const code = (body.code ?? "").replace(/\D/g, "");
  if (!isValidPhone(phone) || code.length !== 6) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ error: "no_signing_key" }, { status: 503 });
  }

  const result = checkCode(phone, code);
  if (result !== "ok") {
    // 401 rather than 400: the request was well formed, the code was not right.
    return NextResponse.json({ error: result }, { status: 401 });
  }

  return NextResponse.json({ ok: true, phone, token: mintProof(phone) });
}
