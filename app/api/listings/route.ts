import { NextResponse } from "next/server";
import { createListing, listByPhone, listOpen, setStatus, type Listing } from "@/lib/listings";
import { isValidPhone } from "@/lib/session-shared";

/**
 * The direct-sale board.
 *
 * GET  — open lots, optionally filtered by crop and state; `mine=<phone>`
 *        returns that farmer's own lots including withdrawn ones.
 * POST — publish a lot. Requires `publishPhone: true`, the farmer's explicit
 *        agreement that buyers will see their number, because that is the
 *        whole mechanism and it should never be implied.
 * PATCH — mark a lot sold or withdrawn. Only the poster's number can.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");

  if (mine) {
    if (!isValidPhone(mine)) return NextResponse.json({ error: "bad_phone" }, { status: 400 });
    return NextResponse.json({ listings: await listByPhone(mine.replace(/\D/g, "")) });
  }

  return NextResponse.json({
    listings: await listOpen({
      cropId: searchParams.get("crop") ?? undefined,
      state: searchParams.get("state") ?? undefined,
    }),
  });
}

export async function POST(req: Request) {
  let body: Partial<Listing> & { publishPhone?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").replace(/\D/g, "");
  if (!isValidPhone(phone)) return NextResponse.json({ error: "bad_phone" }, { status: 400 });

  // Publishing a number is the one irreversible thing here, so it is explicit.
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
  let body: { id?: string; phone?: string; status?: Listing["status"] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const phone = (body.phone ?? "").replace(/\D/g, "");
  if (!body.id || !isValidPhone(phone) || !body.status) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const ok = await setStatus(body.id, phone, body.status);
  return NextResponse.json({ ok }, { status: ok ? 200 : 403 });
}
