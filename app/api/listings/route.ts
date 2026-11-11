import { NextResponse } from "next/server";
import { createListing, listByPhone, listOpen, setStatus, type Listing } from "@/lib/listings";
import { verifiedPhone } from "@/lib/otp";

/**
 * The direct-sale board.
 *
 * GET  — open lots, optionally filtered by crop and state; `mine=1` returns the
 *        caller's own lots, including withdrawn ones.
 * POST — publish a lot. Requires `publishPhone: true`, the farmer's explicit
 *        agreement that buyers will see their number, because that is the whole
 *        mechanism and it should never be implied.
 * PATCH — mark a lot sold or withdrawn. Only the poster can.
 *
 * WHOSE NUMBER: every one of those reads the phone off the bearer token minted
 * by /api/otp/verify, never out of the body or the query string. The body used
 * to carry both the number and the consent tick, which meant a request could
 * publish a stranger's number to every buyer in the state on that stranger's
 * behalf. A caller can claim any number; only its owner holds a token for it.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.has("mine")) {
    const phone = verifiedPhone(req);
    if (!phone) return NextResponse.json({ error: "verify_phone" }, { status: 401 });
    return NextResponse.json({ listings: await listByPhone(phone) });
  }

  return NextResponse.json({
    listings: await listOpen({
      cropId: searchParams.get("crop") ?? undefined,
      state: searchParams.get("state") ?? undefined,
    }),
  });
}

export async function POST(req: Request) {
  const phone = verifiedPhone(req);
  if (!phone) return NextResponse.json({ error: "verify_phone" }, { status: 401 });

  let body: Partial<Listing> & { publishPhone?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  // Proving the number is not the same as agreeing to show it, so the tick
  // still has to be there on its own.
  if (body.publishPhone !== true) {
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }

  const quintals = Number(body.quintals);
  const askPerQtl = Number(body.askPerQtl);
  if (!Number.isFinite(quintals) || quintals <= 0) {
    return NextResponse.json({ error: "bad_quantity" }, { status: 400 });
  }
  if (!Number.isFinite(askPerQtl) || askPerQtl <= 0) {
    return NextResponse.json({ error: "bad_price" }, { status: 400 });
  }
  if (!body.cropId || !body.grade) {
    return NextResponse.json({ error: "bad_lot" }, { status: 400 });
  }

  const listing = await createListing({
    farmerName: (body.farmerName ?? "").slice(0, 60),
    phone,
    cropId: body.cropId,
    grade: body.grade,
    quintals,
    askPerQtl: Math.round(askPerQtl),
    village: (body.village ?? "").slice(0, 60),
    district: (body.district ?? "").slice(0, 60),
    state: (body.state ?? "").slice(0, 60),
    ...(body.readyOn ? { readyOn: body.readyOn } : {}),
    ...(body.note ? { note: body.note.slice(0, 200) } : {}),
  });

  return NextResponse.json({ ok: true, listing });
}

export async function PATCH(req: Request) {
  const phone = verifiedPhone(req);
  if (!phone) return NextResponse.json({ error: "verify_phone" }, { status: 401 });

  let body: { id?: string; status?: Listing["status"] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (!body.id || !body.status) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const ok = await setStatus(body.id, phone, body.status);
  return NextResponse.json({ ok }, { status: ok ? 200 : 403 });
}
