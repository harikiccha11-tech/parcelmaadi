import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/products/export
// Returns a CSV of all products in the same column layout as the import endpoint.
// Columns: Category, Subcategory, Product Name, Brand/Type, Unit, MRP ₹, Market Low ₹,
//          Market High ₹, ParcelMaadi Price ₹, Supplier Price ₹, Margin %, GST %,
//          Stock Status, City, Pincode, Image URL, Last Updated
//
// Query params (optional):
//   - category:   filter by category (exact match)
//   - supplierId: filter by supplier
//   - status:     filter by status

const HEADERS = [
  "Category",
  "Subcategory",
  "Product Name",
  "Brand/Type",
  "Unit",
  "MRP ₹",
  "Market Low ₹",
  "Market High ₹",
  "ParcelMaadi Price ₹",
  "Supplier Price ₹",
  "Margin %",
  "GST %",
  "Stock Status",
  "City",
  "Pincode",
  "Image URL",
  "Last Updated",
];

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const supplierId = url.searchParams.get("supplierId");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (category && category !== "all") where.category = category;
  if (status && status !== "all") where.status = status;
  if (supplierId) where.supplierId = Number(supplierId);

  const products = await db.product.findMany({
    where,
    orderBy: [{ category: "asc" }, { productName: "asc" }],
  });

  const lines: string[] = [HEADERS.join(",")];

  for (const p of products) {
    const lastUpdated = p.lastUpdated
      ? new Date(p.lastUpdated).toISOString().slice(0, 10)
      : "";
    const row = [
      p.category ?? "",
      p.subcategory ?? "",
      p.productName,
      p.brand ?? "",
      p.unit ?? "",
      p.mrp,
      p.marketLowPrice,
      p.marketHighPrice,
      p.sellingPrice,
      p.supplierPrice,
      p.marginPercent,
      p.gstPercent,
      p.status ?? "",
      p.city ?? "",
      p.pincode ?? "",
      p.photoUrl ?? "",
      lastUpdated,
    ];
    lines.push(row.map(csvEscape).join(","));
  }

  const csv = lines.join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="parcelmaadi-products-${stamp}.csv"`,
    },
  });
}
