import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed: Record<string, boolean> = { name: true, slug: true, description: true, iconUrl: true, downloadUrl: true, version: true, fileSize: true, developer: true, category: true, status: true, maintenanceMode: true, maintenanceMsg: true, paymentType: true, upiId: true, upiPayeeName: true, paymentAmount: true, paymentCycle: true, paymentNotes: true, qrUrl: true, comingSoon: true, comingSoonText: true, sortOrder: true };
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!allowed[k]) continue;
    if (k === "paymentAmount" || k === "sortOrder") data[k] = v === "" || v === null ? 0 : Number(v);
    else if (k === "comingSoon") data[k] = v === true || v === "true";
    else data[k] = v === "" ? null : v;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  try {
    const apk = await db.apk.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ apk });
  } catch (e: any) {
    if (String(e?.code || "") === "P2002") return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const { id } = await params;
  try {
    await db.apk.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
