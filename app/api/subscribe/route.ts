import { NextResponse } from "next/server";
import { subscribe, unsubscribe } from "@/lib/subscribers";
import { isValidPhone } from "@/lib/session-shared";
import type { CostEntry, Farm } from "@/lib/types";
import type { Lang } from "@/lib/i18n";

/**
 * Opt in or out of the 5am WhatsApp plan.
 *
 * A row is written here only when a farmer switches the setting on, and removed
 * the moment they switch it off. Nothing subscribes anybody implicitly.
 *
 * The farm profile travels with the request because the server has no other
 * copy of it — see lib/subscribers.ts. The app re-posts after a farm edit so
 * the 5am message does not go out describing last month's garden.
 */

export async function POST(req: Request) {
  let body: {
    phone?: string;
    name?: string;
    lang?: Lang;
    farm?: Farm;
    costs?: CostEntry[];
    enabled?: boolean;
    role?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").replace(/\D/g, "");
  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "bad_phone" }, { status: 400 });
  }

  // The 5am message is a farm plan. A buyer has no farm, so subscribing one
  // would send them somebody else's irrigation advice. The settings screen no
  // longer offers it; this makes sure the endpoint agrees.
  if (body.role === "buyer") {
    return NextResponse.json({ error: "not_for_buyers" }, { status: 400 });
  }

  if (body.enabled === false) {
    await unsubscribe(phone);
    return NextResponse.json({ ok: true, subscribed: false });
  }

  if (!body.farm) {
    return NextResponse.json({ error: "no_farm" }, { status: 400 });
  }

  await subscribe({
    phone,
    name: body.name ?? "",
    lang: body.lang ?? "en",
    farm: body.farm,
    costs: body.costs ?? [],
  });

  return NextResponse.json({ ok: true, subscribed: true });
}
