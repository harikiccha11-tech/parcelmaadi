import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/products
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" }, include: { supplier: true } });
  return NextResponse.json({ products });
}

// POST /api/admin/products
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const {
    supplierId, category, subcategory, productName, brand, packSize, unit,
    mrp, marketLowPrice, marketHighPrice, supplierPrice, sellingPrice,
    marginPercent, gstPercent, handlingFee, priceSource,
    stock, expiryResponsibility, photoUrl, status, city, pincode, lastUpdated,
  } = body || {};
  if (!productName) return NextResponse.json({ error: "productName required" }, { status: 400 });
  if (!supplierId) return NextResponse.json({ error: "supplierId required" }, { status: 400 });
  const product = await db.product.create({
    data: {
      supplierId: Number(supplierId),
      category: category || null,
      subcategory: subcategory || null,
      productName,
      brand: brand || null,
      packSize: packSize || unit || null,
      unit: unit || null,
      mrp: Number(mrp) || 0,
      marketLowPrice: Number(marketLowPrice) || 0,
      marketHighPrice: Number(marketHighPrice) || 0,
      supplierPrice: Number(supplierPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      marginPercent: Number(marginPercent) || 0,
      gstPercent: Number(gstPercent) || 0,
      handlingFee: Number(handlingFee) || 0,
      priceSource: priceSource || null,
      stock: Number(stock) || 0,
      expiryResponsibility: expiryResponsibility || null,
      photoUrl: photoUrl || null,
      status: status || "Active",
      city: city || null,
      pincode: pincode || null,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date(),
    },
    include: { supplier: true },
  });
  return NextResponse.json({ product });
}
