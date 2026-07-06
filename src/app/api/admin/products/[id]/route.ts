import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/products/{id}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const body = await req.json();
  const allowed = [
    "supplierId", "category", "subcategory", "productName", "brand", "packSize", "unit",
    "mrp", "marketLowPrice", "marketHighPrice", "supplierPrice", "sellingPrice",
    "marginPercent", "gstPercent", "handlingFee", "priceSource",
    "stock", "expiryResponsibility", "photoUrl", "status", "city", "pincode", "lastUpdated",
  ];
  const numericFields = new Set([
    "mrp", "marketLowPrice", "marketHighPrice", "supplierPrice", "sellingPrice",
    "marginPercent", "gstPercent", "handlingFee", "stock",
  ]);
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) {
      if (k === "supplierId") {
        data[k] = body[k] ? Number(body[k]) : null;
      } else if (numericFields.has(k)) {
        data[k] = Number(body[k]) || 0;
      } else if (k === "lastUpdated") {
        data[k] = body[k] ? new Date(body[k] as string) : new Date();
      } else {
        data[k] = body[k] ?? null;
      }
    }
  }
  const product = await db.product.update({ where: { id: Number(id) }, data, include: { supplier: true } });
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  await db.product.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
