import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/material/shops?vehicleSlug=sand&quantity=5&deliveryLat=12.97&deliveryLng=77.59
// Returns all shops offering that material, sorted by FINAL LANDED PRICE
// (quantity × perUnitRate + delivery charge), low to high. Best Price badge on first.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const vehicleSlug = url.searchParams.get("vehicleSlug");
    const quantity = Number(url.searchParams.get("quantity") || 1);
    const deliveryLat = url.searchParams.get("deliveryLat") ? Number(url.searchParams.get("deliveryLat")) : null;
    const deliveryLng = url.searchParams.get("deliveryLng") ? Number(url.searchParams.get("deliveryLng")) : null;

    if (!vehicleSlug) return NextResponse.json({ error: "vehicleSlug required" }, { status: 400 });

    const vehicle = await db.vehicle.findFirst({ where: { slug: vehicleSlug } });
    if (!vehicle) return NextResponse.json({ error: "Material not found" }, { status: 404 });

    const prices = await db.priceMaster.findMany({
      where: { vehicleId: vehicle.id, status: "Active", supplierId: { not: null } },
      include: { supplier: true, vehicle: true },
    });

    // compute landed price per shop
    const cards = prices.map((p) => {
      const sup = p.supplier;
      const materialCost = Math.round(quantity * p.perUnitRate);
      let deliveryCharge = sup?.flatDeliveryFee || 0;
      let distanceKm: number | null = null;
      // distance-based delivery if shop has coords + delivery coords
      if (sup?.addressLat != null && sup?.addressLng != null && deliveryLat != null && deliveryLng != null) {
        const R = 6371;
        const dLat = ((deliveryLat - sup.addressLat) * Math.PI) / 180;
        const dLng = ((deliveryLng - sup.addressLng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos((sup.addressLat * Math.PI) / 180) * Math.cos((deliveryLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
        const straight = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Number((straight * 1.3).toFixed(2)); // road factor
        // delivery charge = ₹15/km (configurable per-shop via flatDeliveryFee as fallback floor)
        const distCharge = Math.round(distanceKm * 15);
        deliveryCharge = Math.max(distCharge, sup.flatDeliveryFee || 0);
      }
      const subtotal = materialCost + deliveryCharge;
      const gst = Math.round((subtotal * p.gstPercent) / 100);
      const finalLandedPrice = subtotal + gst;
      return {
        priceId: p.id,
        shop: { id: sup!.id, name: sup!.supplierName, address: sup!.address, lat: sup!.addressLat, lng: sup!.addressLng, mapLink: sup!.addressMapLink, mobile: sup!.mobile },
        material: { name: vehicle.name, unitType: p.unitType, perUnitRate: p.perUnitRate },
        quantity,
        materialCost,
        deliveryCharge,
        distanceKm,
        gst,
        finalLandedPrice,
        advancePercent: p.advancePercent,
        advanceAmount: Math.round((finalLandedPrice * p.advancePercent) / 100),
      };
    });
    cards.sort((a, b) => a.finalLandedPrice - b.finalLandedPrice);
    return NextResponse.json({ cards, bestPriceId: cards[0]?.priceId || null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
