import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/suppliers/{id} — approve/reject/hide/update
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["supplierName", "shopName", "mobile", "whatsapp", "address", "addressLat", "addressLng", "addressMapLink", "flatDeliveryFee", "mapLocation", "supplierType", "aadhaarUrl", "panUrl", "gstUrl", "udyamUrl", "fssaiUrl", "bankDetails", "upiId", "qrUrl", "shopPhotoUrl", "serviceArea", "commissionPercent", "status"];
  const data: any = {};
  for (const k of allowed) {
    if (k in body) {
      if (["addressLat", "addressLng"].includes(k)) data[k] = body[k] ? Number(body[k]) : null;
      else if (["commissionPercent", "flatDeliveryFee"].includes(k)) data[k] = Number(body[k]) || 0;
      else data[k] = body[k];
    }
  }
  const supplier = await db.supplier.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ supplier });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  await db.supplier.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
