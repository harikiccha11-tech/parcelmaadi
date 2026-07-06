import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/vehicles/{id}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["serviceId", "name", "slug", "maxLoad", "imageUrl", "recommendedUse", "status", "sortOrder"];
  const data: any = {};
  for (const k of allowed) {
    if (k in body) data[k] = ["serviceId", "sortOrder"].includes(k) ? Number(body[k]) : body[k];
  }
  const vehicle = await db.vehicle.update({ where: { id: Number(id) }, data, include: { service: true } });
  return NextResponse.json({ vehicle });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  await db.vehicle.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
