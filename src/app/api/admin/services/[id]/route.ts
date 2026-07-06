import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/services/{id} — update service
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "slug", "description", "imageUrl", "icon", "status", "sortOrder"];
  const data: any = {};
  for (const k of allowed) {
    if (k in body) data[k] = k === "sortOrder" ? Number(body[k]) : body[k];
  }
  const service = await db.service.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ service });
}

// also handle vehicle create under service via this endpoint? separate not needed.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  // Soft delete by hiding — but spec says remove allowed. We hard delete.
  await db.service.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
