import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/price-master — list all prices
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const prices = await db.priceMaster.findMany({
    orderBy: { serviceId: "asc" },
    include: { service: true, vehicle: true, supplier: true },
  });
  return NextResponse.json({ prices });
}

// POST /api/admin/price-master — add price item
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const { serviceId, vehicleId, supplierId, itemType, pricingType, unitType, perUnitRate, minimumKm, minimumFare, perKmRate, slabJson, loadingCharge, waitingCharge, helperCharge, nightChargePercent, expressChargePercent, extraCharge, discountPercent, gstPercent, advancePercent, minimumBooking, commissionPercent, roundTripMultiplier, rushSurchargePercent, notes, status } = body || {};
  if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });
  const price = await db.priceMaster.create({
    data: {
      serviceId: Number(serviceId),
      vehicleId: vehicleId ? Number(vehicleId) : null,
      supplierId: supplierId ? Number(supplierId) : null,
      itemType: itemType || null,
      pricingType: pricingType || "standard",
      unitType: unitType || null,
      perUnitRate: Number(perUnitRate) || 0,
      minimumKm: Number(minimumKm) || 0,
      minimumFare: Number(minimumFare) || 0,
      perKmRate: Number(perKmRate) || 0,
      slabJson: slabJson || "",
      loadingCharge: Number(loadingCharge) || 0,
      waitingCharge: Number(waitingCharge) || 0,
      helperCharge: Number(helperCharge) || 0,
      nightChargePercent: Number(nightChargePercent) || 0,
      expressChargePercent: Number(expressChargePercent) || 0,
      extraCharge: Number(extraCharge) || 0,
      discountPercent: Number(discountPercent) || 0,
      gstPercent: Number(gstPercent) || 0,
      advancePercent: Number(advancePercent) || 0,
      minimumBooking: Number(minimumBooking) || 0,
      commissionPercent: Number(commissionPercent) || 0,
      roundTripMultiplier: Number(roundTripMultiplier) || 1.8,
      rushSurchargePercent: Number(rushSurchargePercent) || 0,
      notes: notes || null,
      status: status || "Active",
    },
    include: { service: true, vehicle: true, supplier: true },
  });
  return NextResponse.json({ price });
}
