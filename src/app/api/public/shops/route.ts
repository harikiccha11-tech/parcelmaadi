import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/shops — list all approved suppliers as "shops"
// Optional ?type=restaurant to filter only restaurants
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  let where: any = { status: "Approved", products: { some: {} } };
  if (type === "restaurant") {
    // Show only restaurant-type suppliers
    where.supplierType = { in: ["Biryani Restaurant", "South Indian Restaurant", "North Indian Restaurant", "Pure Veg Restaurant", "Bakery & Desserts", "Snacks & Beverages"] };
  } else if (type === "shop") {
    // Show only non-restaurant shops
    where.supplierType = { notIn: ["Biryani Restaurant", "South Indian Restaurant", "North Indian Restaurant", "Pure Veg Restaurant", "Bakery & Desserts", "Snacks & Beverages"] };
  }

  const shops = await db.supplier.findMany({
    where,
    select: {
      id: true,
      supplierName: true,
      shopName: true,
      supplierType: true,
      address: true,
      flatDeliveryFee: true,
      shopPhotoUrl: true,
      _count: { select: { products: true } },
    },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ shops });
}
