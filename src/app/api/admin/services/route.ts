import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/services — list all services (incl. hidden)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const services = await db.service.findMany({ orderBy: { sortOrder: "asc" }, include: { vehicles: true, _count: { select: { bookings: true } } } });
  return NextResponse.json({ services });
}

// POST /api/admin/services — add service (Owner + Operations only)
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View" || auth.admin.role === "Accounts")
    return NextResponse.json({ error: "Only Owner and Operations can create services" }, { status: 403 });
  const body = await req.json();
  const { name, slug, description, imageUrl, icon, status, sortOrder } = body || {};
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const finalSlug = slug || String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const service = await db.service.create({
    data: {
      name,
      slug: finalSlug,
      description: description || null,
      imageUrl: imageUrl || null,
      icon: icon || null,
      status: status || "Active",
      sortOrder: Number(sortOrder) || 0,
    },
  });
  return NextResponse.json({ service });
}
