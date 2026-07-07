import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/offers — list all Offers
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const archived = url.searchParams.get("archived") === "true";
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");
    const limit = Number(url.searchParams.get("limit") || 200);

    const where: any = {};
    // archived filter not applicable for this model
    if (status && "status" in db.offer.fields) where.status = status;
    

    const items = await db.offer.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit,
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/offers — create
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const allowed = ["title","description","offerType","value","minOrderAmount","maxDiscount","applicableServices","startDate","endDate","usageLimit"];
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }
    const item = await db.offer.create({ data });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}
