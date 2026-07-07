import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseListParams, paginatedResponse } from "@/lib/list-utils";

// GET /api/admin/supplier — paginated list
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { where, page, limit, skip, take, sortBy, sortOrder } = parseListParams(req, {
      searchFields: ['shopName', 'supplierName', 'mobile'],
      filterFields: ['status'],
      hasArchived: false,
      defaultSortBy: "createdAt",
    });

    const [items, total] = await Promise.all([
      db.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        include: { _count: { select: { products: true } } },
      }),
      db.supplier.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/supplier — create (kept as-is, simplified)
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    // Convert numeric fields
    const data: any = { ...body };
    for (const k of ["id", "supplierId", "serviceId", "vehicleId", "zoneId", "parentId", "sortOrder", "stock"]) {
      if (k in data && data[k] !== null && data[k] !== "") data[k] = Number(data[k]);
    }
    for (const k of ["mrp", "supplierPrice", "sellingPrice", "marketLowPrice", "marketHighPrice", "marginPercent", "gstPercent", "handlingFee", "flatDeliveryFee", "commissionPercent", "lat", "lng"]) {
      if (k in data && data[k] !== null && data[k] !== "") data[k] = Number(data[k]);
    }
    const item = await db.supplier.create({ data });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}
