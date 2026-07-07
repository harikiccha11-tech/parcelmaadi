import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/settlements — list all Settlements
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
    if (status && "status" in db.settlement.fields) where.status = status;
    

    const items = await db.settlement.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit,
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/settlements — create
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const allowed = ["riderId","vendorId","periodStart","periodEnd","totalRides","grossAmount","commission","netAmount","notes"];
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }
    const item = await db.settlement.create({ data });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}
