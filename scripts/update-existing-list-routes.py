#!/usr/bin/env python3
"""Update existing admin list routes to support pagination."""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project/src/app/api/admin")

# Updates for existing list endpoints
UPDATES = {
    "products": {
        "model": "product",
        "search_fields": ["productName", "brand", "category"],
        "filter_fields": ["status"],
        "has_archived": False,
        "include": "{ supplier: true }",
        "default_sort": "createdAt",
    },
    "suppliers": {
        "model": "supplier",
        "search_fields": ["shopName", "supplierName", "mobile"],
        "filter_fields": ["status"],
        "has_archived": False,
        "include": "{ _count: { select: { products: true } } }",
        "default_sort": "createdAt",
    },
    "customers": {
        "model": "customer",
        "search_fields": ["name", "mobile", "email"],
        "filter_fields": [],
        "has_archived": False,
        "include": "{ _count: { select: { bookings: true } } }",
        "default_sort": "createdAt",
    },
    "services": {
        "model": "service",
        "search_fields": ["name", "slug"],
        "filter_fields": ["status"],
        "has_archived": False,
        "include": "{ vehicles: true, _count: { select: { bookings: true } } }",
        "default_sort": "sortOrder",
    },
    "vehicles": {
        "model": "vehicle",
        "search_fields": ["name", "slug"],
        "filter_fields": ["status"],
        "has_archived": False,
        "include": "{ service: true }",
        "default_sort": "id",
    },
    "zones": {
        "model": "zone",
        "search_fields": ["name", "slug"],
        "filter_fields": ["status"],
        "has_archived": False,
        "include": "{}",
        "default_sort": "id",
    },
    "coupons": {
        "model": "coupon",
        "search_fields": ["code"],
        "filter_fields": ["status"],
        "has_archived": False,
        "include": "{}",
        "default_sort": "createdAt",
    },
}

def gen_route(config):
    return f'''import {{ NextResponse }} from "next/server";
import {{ db }} from "@/lib/db";
import {{ requireAdmin }} from "@/lib/auth";
import {{ parseListParams, paginatedResponse }} from "@/lib/list-utils";

// GET /api/admin/{config["model"]} — paginated list
export async function GET(req: Request) {{
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({{ error: auth.error }}, {{ status: auth.status }});
  try {{
    const {{ where, page, limit, skip, take, sortBy, sortOrder }} = parseListParams(req, {{
      searchFields: {config["search_fields"]},
      filterFields: {config["filter_fields"]},
      hasArchived: {str(config["has_archived"]).lower()},
      defaultSortBy: "{config["default_sort"]}",
    }});

    const [items, total] = await Promise.all([
      db.{config["model"]}.findMany({{
        where,
        skip,
        take,
        orderBy: {{ [sortBy]: sortOrder }},
        include: {config["include"]},
      }}),
      db.{config["model"]}.count({{ where }}),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  }} catch (e: any) {{
    return NextResponse.json({{ error: e?.message || "Failed to fetch" }}, {{ status: 500 }});
  }}
}}

// POST /api/admin/{config["model"]} — create (kept as-is, simplified)
export async function POST(req: Request) {{
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({{ error: auth.error }}, {{ status: auth.status }});
  if (auth.admin.role === "View") return NextResponse.json({{ error: "Read-only role" }}, {{ status: 403 }});
  try {{
    const body = await req.json();
    // Convert numeric fields
    const data: any = {{ ...body }};
    for (const k of ["id", "supplierId", "serviceId", "vehicleId", "zoneId", "parentId", "sortOrder", "stock"]) {{
      if (k in data && data[k] !== null && data[k] !== "") data[k] = Number(data[k]);
    }}
    for (const k of ["mrp", "supplierPrice", "sellingPrice", "marketLowPrice", "marketHighPrice", "marginPercent", "gstPercent", "handlingFee", "flatDeliveryFee", "commissionPercent", "lat", "lng"]) {{
      if (k in data && data[k] !== null && data[k] !== "") data[k] = Number(data[k]);
    }}
    const item = await db.{config["model"]}.create({{ data }});
    return NextResponse.json({{ item }});
  }} catch (e: any) {{
    return NextResponse.json({{ error: e?.message || "Create failed" }}, {{ status: 500 }});
  }}
}}
'''

# Backup originals and write new versions
for name, config in UPDATES.items():
    f = ROOT / name / "route.ts"
    # Backup
    backup = ROOT / name / "route.original.ts.bak"
    if not backup.exists() and f.exists():
        backup.write_text(f.read_text())
    # Write new version
    f.write_text(gen_route(config))
    print(f"✅ {name}/route.ts (backup: route.original.ts.bak)")

print(f"\n✅ Updated {len(UPDATES)} existing list endpoints with pagination")
