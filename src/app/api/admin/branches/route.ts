import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/branches — list all Branchs
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
    if ("archived" in db.branch.fields) where.archived = archived;
    if (status && "status" in db.branch.fields) where.status = status;
    

    const items = await db.branch.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit,
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/branches — create
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const allowed = ["name","code","address","city","pincode","mobile","email","managerName","managerMobile","lat","lng","zoneId"];
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }
    const item = await db.branch.create({ data });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}
