import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/vehicles — list all vehicles (with service)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const vehicles = await db.vehicle.findMany({ orderBy: { serviceId: "asc" }, include: { service: true } });
  return NextResponse.json({ vehicles });
}

// POST /api/admin/vehicles — add vehicle to a service
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const { serviceId, name, slug, maxLoad, imageUrl, recommendedUse, status, sortOrder } = body || {};
  if (!serviceId || !name) return NextResponse.json({ error: "serviceId and name required" }, { status: 400 });
  const vehicle = await db.vehicle.create({
    data: {
      serviceId: Number(serviceId),
      name,
      slug: slug || null,
      maxLoad: maxLoad || null,
      imageUrl: imageUrl || null,
      recommendedUse: recommendedUse || null,
      status: status || "Active",
      sortOrder: Number(sortOrder) || 0,
    },
    include: { service: true },
  });
  return NextResponse.json({ vehicle });
}
