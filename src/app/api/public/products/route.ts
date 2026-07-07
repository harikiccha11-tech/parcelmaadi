import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveZone, filterByZone } from "@/lib/zone-resolver";

// GET /api/public/products — approved products from approved suppliers
// Optional ?pincode=560001 or ?city=Bengaluru — filters by zone availability
export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = url.searchParams.get("pincode") || undefined;
  const city = url.searchParams.get("city") || undefined;

  const zoneId = await resolveZone({ pincode, city });

  let products = await db.product.findMany({
    where: { status: "Active" },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });
  // Only show products whose supplier is approved
  let visible = products.filter((p) => p.supplier && p.supplier.status === "Approved");

  // Filter by zone availability
  visible = await filterByZone(visible, zoneId, "Product");

  return NextResponse.json({ products: visible });
}
