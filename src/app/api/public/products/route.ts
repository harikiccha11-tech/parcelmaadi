import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/products — approved products from approved suppliers
export async function GET() {
  const products = await db.product.findMany({
    where: { status: "Active" },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });
  // Only show products whose supplier is approved
  const visible = products.filter((p) => p.supplier && p.supplier.status === "Approved");
  return NextResponse.json({ products: visible });
}
