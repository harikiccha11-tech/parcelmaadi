import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const zones = await db.zone.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { priceMaster: true } } } });
  return NextResponse.json({ zones });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const body = await req.json();
  const { name, slug, description, pinCodes, cities, status } = body || {};
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const finalSlug = slug || String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const zone = await db.zone.create({ data: { name, slug: finalSlug, description: description || null, pinCodes: pinCodes || null, cities: cities || null, status: status || "Active" } });
  return NextResponse.json({ zone });
}
