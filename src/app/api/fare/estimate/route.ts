import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSlabs } from "@/lib/fare";
import { getPorterMatchConfig, isNightChargeActive } from "@/lib/config";
import { computeForPrice } from "@/lib/fare-compute";

// POST /api/fare/estimate — calculate fare using price master
// Supports: single priceId OR multi (serviceId → all vehicle price cards)
// Handles pricingType: standard | hourly | daily | per-trip | per-unit
// Handles outstation roundTripMultiplier (tripType=Round-Trip) + emergency rushSurchargePercent
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { priceId, serviceId, distanceKm, isNight, isExpress, needsHelper, waitingMinutes, tollParking, loadingChargeOverride, extraChargeOverride, tripType, durationHours, durationDays, materialCost, deliveryCharge } = body || {};

    const distance = Number(distanceKm) || 0;
    const nightAuto = await isNightChargeActive();
    const nightActive = isNight || nightAuto;

    // Multi-vehicle price cards
    if (!priceId && serviceId) {
      const prices = await db.priceMaster.findMany({
        where: { serviceId: Number(serviceId), status: "Active" },
        include: { vehicle: true, service: true },
      });
      const porterConfig = await getPorterMatchConfig();
      const cards = prices.map((p) => {
        const pc = { ...porterConfig, commissionPercent: p.commissionPercent || porterConfig.commissionPercent };
        const breakup = computeForPrice(p, { distance, nightActive, isExpress, needsHelper, waitingMinutes, tollParking, loadingChargeOverride, extraChargeOverride, tripType, durationHours, durationDays, porterConfig: pc, materialCost, deliveryCharge });
        return { price: p, breakup, slabs: parseSlabs(p.slabJson) };
      });
      return NextResponse.json({ cards });
    }

    if (!priceId) return NextResponse.json({ error: "priceId or serviceId required" }, { status: 400 });

    const price = await db.priceMaster.findUnique({ where: { id: Number(priceId) }, include: { service: true, vehicle: true } });
    if (!price) return NextResponse.json({ error: "Price not found" }, { status: 404 });
    if (price.status !== "Active") return NextResponse.json({ error: "Price inactive" }, { status: 400 });

    const porterConfig = await getPorterMatchConfig(price.commissionPercent || 0);
    const breakup = computeForPrice(price, { distance, nightActive, isExpress, needsHelper, waitingMinutes, tollParking, loadingChargeOverride, extraChargeOverride, tripType, durationHours, durationDays, porterConfig, materialCost, deliveryCharge });
    return NextResponse.json({ price, breakup, slabs: parseSlabs(price.slabJson) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Fare estimate failed" }, { status: 500 });
  }
}
