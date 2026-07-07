#!/usr/bin/env python3
"""Update remaining admin list routes (services, vehicles, zones, coupons) with pagination + unified {items, total} shape."""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project/src/app/api/admin")

# These endpoints still use OLD shape — update them to use new {items, total, page, totalPages} shape
# Keep their custom POST logic intact (since they have specific business rules)
UPDATES = {
    "services": {
        "model": "service",
        "search_fields": ["name", "slug"],
        "filter_fields": ["status"],
        "default_sort": "sortOrder",
        "include": "{ vehicles: true, _count: { select: { bookings: true } } }",
    },
    "vehicles": {
        "model": "vehicle",
        "search_fields": ["name", "slug"],
        "filter_fields": ["status"],
        "default_sort": "id",
        "include": "{ service: true }",
    },
    "zones": {
        "model": "zone",
        "search_fields": ["name", "slug"],
        "filter_fields": ["status"],
        "default_sort": "id",
        "include": "{}",
    },
    "coupons": {
        "model": "coupon",
        "search_fields": ["code"],
        "filter_fields": ["status"],
        "default_sort": "createdAt",
        "include": "{}",
    },
}

def gen_get_only(config_name, config):
    """Generate just the GET handler — keep POST/DELETE intact by reading existing file."""
    return f'''import {{ NextResponse }} from "next/server";
import {{ db }} from "@/lib/db";
import {{ requireAdmin }} from "@/lib/auth";
import {{ parseListParams, paginatedResponse }} from "@/lib/list-utils";

// GET /api/admin/{config_name} — paginated list with unified {{items, total}} shape
export async function GET(req: Request) {{
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({{ error: auth.error }}, {{ status: auth.status }});
  try {{
    const {{ where, page, limit, skip, take, sortBy, sortOrder }} = parseListParams(req, {{
      searchFields: {config["search_fields"]},
      filterFields: {config["filter_fields"]},
      hasArchived: false,
      defaultSortBy: "{config["default_sort"]}",
    }});

    const [items, total] = await Promise.all([
      db.{config["model"]}.findMany({{
        where,
        skip,
        take,
        orderBy: {{ [sortBy as string]: sortOrder }},
        include: {config["include"]},
      }}),
      db.{config["model"]}.count({{ where }}),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  }} catch (e: any) {{
    return NextResponse.json({{ error: e?.message || "Failed to fetch" }}, {{ status: 500 }});
  }}
}}

'''

for name, config in UPDATES.items():
    f = ROOT / name / "route.ts"
    if not f.exists():
        print(f"⚠ {name}/route.ts not found — skipping")
        continue
    
    content = f.read_text()
    
    # Backup
    backup = ROOT / name / "route.original.ts.bak2"
    if not backup.exists():
        backup.write_text(content)
    
    # Extract everything after the GET handler (POST, etc.)
    # Find "// POST" or "export async function POST"
    post_match = re.search(r'(\n// POST[\s\S]*$)', content)
    if post_match:
        post_section = post_match.group(1)
    else:
        post_match = re.search(r'(\nexport async function POST[\s\S]*$)', content)
        post_section = post_match.group(1) if post_match else ""
    
    # New content: new GET + old POST
    new_content = gen_get_only(name, config) + post_section.lstrip('\n')
    f.write_text(new_content)
    print(f"✅ Updated {name}/route.ts — GET now returns unified shape, POST preserved")

print(f"\n✅ Updated {len(UPDATES)} endpoints")
