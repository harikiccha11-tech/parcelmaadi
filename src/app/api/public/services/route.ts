import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/services — active services for customer website.
// Returns `startingPriceText` per service so cards never show a blank price.
// Falls back to a per-slug label when no price-master rows exist.
export async function GET() {
  const services = await db.service.findMany({
    where: { status: { in: ["Active", "Coming Soon"] } },
    orderBy: { sortOrder: "asc" },
    include: {
      vehicles: { where: { status: "Active" }, orderBy: { sortOrder: "asc" } },
      priceMaster: {
        where: { status: "Active" },
        select: { minimumFare: true, perUnitRate: true, unitType: true, pricingType: true },
      },
    },
  });

  const fallback: Record<string, string> = {
    "parcel-delivery": "Starting from ₹49",
    "goods-transport": "Starting from ₹399",
    "material-supply": "Starting from ₹1,500",
    "machinery-rental": "Starting from ₹1,200/hr",
    "water-supply": "Starting from ₹700",
    "borewell-drilling": "Starting from ₹150/ft",
    "supplier-shop": "Starting from ₹25",
    "outstation-booking": "Starting from ₹799",
    "emergency-booking": "Priority pricing",
  };

  const withStartingPrice = services.map((svc) => {
    const prices = svc.priceMaster
      .map((p) =>
        Number(p.pricingType === "per-unit" && p.perUnitRate > 0 ? p.perUnitRate : p.minimumFare)
      )
      .filter((n) => Number.isFinite(n) && n > 0);
    const min = prices.length ? Math.min(...prices) : null;
    const unit = svc.priceMaster.find(
      (p) => p.pricingType === "per-unit" && Number(p.perUnitRate) === min
    )?.unitType;
    const startingPriceText = min
      ? `Starting from ₹${Math.round(min).toLocaleString("en-IN")}${unit ? `/${unit}` : ""}`
      : fallback[svc.slug] || "Price on Request";
    const { priceMaster, ...clean } = svc;
    return { ...clean, startingPriceText };
  });

  return NextResponse.json({ services: withStartingPrice });
}
