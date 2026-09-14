import { NextResponse } from "next/server";
import {
  closeRequirement,
  createRequirement,
  listOpenRequirements,
  requirementsByPhone,
  type Requirement,
} from "@/lib/requirements";
import { verifiedPhone } from "@/lib/otp";

/**
 * Buy requirements — the demand side of the direct board.
 *
 * GET   — open requirements, filtered by crop and state; `mine=1` returns the
 *         caller's own, including closed ones.
 * POST  — publish a requirement. Needs `publishPhone: true`, same as listings:
 *         a number that has been seen cannot be unseen.
 * PATCH — close one. Only the posting number can.
 *
 * The number comes off the bearer token, not the body — see app/api/listings.
 * A buyer's number is published to growers exactly as a grower's is to buyers,
 * so it is proved the same way.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.has("mine")) {
    const phone = verifiedPhone(req);
    if (!phone) return NextResponse.json({ error: "verify_phone" }, { status: 401 });
    return NextResponse.json({ requirements: await requirementsByPhone(phone) });
  }

  return NextResponse.json({
    requirements: await listOpenRequirements({
      cropId: searchParams.get("crop") ?? undefined,
      state: searchParams.get("state") ?? undefined,
    }),
  });
}

export async function POST(req: Request) {
  const phone = verifiedPhone(req);
  if (!phone) return NextResponse.json({ error: "verify_phone" }, { status: 401 });

  let body: Partial<Requirement> & { publishPhone?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (body.publishPhone !== true) {
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }

  const quintals = Number(body.quintals);
  const offerPerQtl = Number(body.offerPerQtl);
  if (!Number.isFinite(quintals) || quintals <= 0) {
    return NextResponse.json({ error: "bad_quantity" }, { status: 400 });
  }
  if (!Number.isFinite(offerPerQtl) || offerPerQtl <= 0) {
    return NextResponse.json({ error: "bad_price" }, { status: 400 });
  }
  if (!body.cropId) return NextResponse.json({ error: "bad_crop" }, { status: 400 });

  const requirement = await createRequirement({
    business: (body.business ?? "").slice(0, 60),
    contactName: (body.contactName ?? "").slice(0, 60),
    phone,
    cropId: body.cropId,
    grade: body.grade ?? "",
    quintals,
    offerPerQtl: Math.round(offerPerQtl),
    district: (body.district ?? "").slice(0, 60),
    state: (body.state ?? "").slice(0, 60),
    ...(body.note ? { note: body.note.slice(0, 200) } : {}),
  });

  return NextResponse.json({ ok: true, requirement });
}

export async function PATCH(req: Request) {
  const phone = verifiedPhone(req);
  if (!phone) return NextResponse.json({ error: "verify_phone" }, { status: 401 });

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const ok = await closeRequirement(body.id, phone);
  return NextResponse.json({ ok }, { status: ok ? 200 : 403 });
}
