import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "slug", "description", "pinCodes", "cities", "status"];
  const data: any = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  const zone = await db.zone.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ zone });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const { id } = await params;
  await db.zone.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
