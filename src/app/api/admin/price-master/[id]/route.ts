import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/price-master/{id} — update price item
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["serviceId", "vehicleId", "supplierId", "itemType", "pricingType", "unitType", "perUnitRate", "minimumKm", "minimumFare", "perKmRate", "slabJson", "loadingCharge", "waitingCharge", "helperCharge", "nightChargePercent", "expressChargePercent", "extraCharge", "discountPercent", "gstPercent", "advancePercent", "minimumBooking", "commissionPercent", "roundTripMultiplier", "rushSurchargePercent", "notes", "status"];
  const data: any = {};
  for (const k of allowed) {
    if (k in body) {
      const v = body[k];
      data[k] = ["minimumKm", "minimumFare", "perKmRate", "perUnitRate", "loadingCharge", "waitingCharge", "helperCharge", "nightChargePercent", "expressChargePercent", "extraCharge", "discountPercent", "gstPercent", "advancePercent", "minimumBooking", "commissionPercent", "roundTripMultiplier", "rushSurchargePercent"].includes(k)
        ? (v === "" ? 0 : Number(v))
        : ["serviceId", "vehicleId", "supplierId"].includes(k)
          ? (v ? Number(v) : null)
          : v;
    }
  }
  const price = await db.priceMaster.update({ where: { id: Number(id) }, data, include: { service: true, vehicle: true, supplier: true } });
  return NextResponse.json({ price });
}

// DELETE
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  await db.priceMaster.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
