#!/usr/bin/env python3
"""Regenerate all admin list endpoints with pagination support."""
import os
from pathlib import Path

ROOT = Path("/home/z/my-project/src/app/api/admin")

# Module definitions: (endpoint, model, searchFields, hasArchived, filterFields)
MODULES = [
    ("riders", "rider", ["name", "mobile", "email"], True, ["status"]),
    ("branches", "branch", ["name", "code", "city"], True, ["status"]),
    ("categories", "category", ["name", "slug"], True, ["status"]),
    ("cities", "city", ["name", "state", "code"], True, ["status"]),
    ("offers", "offer", ["title", "description"], False, ["status"]),
    ("wallets", "wallet", [], False, ["status"]),
    ("settlements", "settlement", [], False, ["status"]),
    ("audit-logs", "auditLog", ["adminEmail", "action", "module"], False, []),
    ("feature-flags", "featureFlag", ["key", "label"], False, []),
    ("api-keys", "apiKey", ["name"], False, ["status"]),
    ("integrations", "integration", ["name", "category"], False, ["status"]),
    ("banners", "banner", ["title"], False, ["status"]),
    ("notifications", "notificationLog", ["channel", "recipient", "subject"], False, ["status"]),
    ("support", "supportTicket", ["subject", "description"], False, ["status", "priority"]),
]

def gen_route(module, model, search_fields, has_archived, filter_fields):
    search_fields_str = str(search_fields) if search_fields else "[]"
    filter_fields_str = str(filter_fields) if filter_fields else "[]"
    return f'''import {{ NextResponse }} from "next/server";
import {{ db }} from "@/lib/db";
import {{ requireAdmin }} from "@/lib/auth";
import {{ parseListParams, paginatedResponse }} from "@/lib/list-utils";

// GET /api/admin/{module} — paginated list with search + filters
export async function GET(req: Request) {{
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({{ error: auth.error }}, {{ status: auth.status }});
  try {{
    const {{ where, page, limit, skip, take, sortBy, sortOrder }} = parseListParams(req, {{
      searchFields: {search_fields_str},
      filterFields: {filter_fields_str},
      hasArchived: {str(has_archived).lower()},
      defaultSortBy: "id",
    }});

    const [items, total] = await Promise.all([
      db.{model}.findMany({{
        where,
        skip,
        take,
        orderBy: {{ [sortBy]: sortOrder }},
      }}),
      db.{model}.count({{ where }}),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  }} catch (e: any) {{
    return NextResponse.json({{ error: e?.message || "Failed to fetch" }}, {{ status: 500 }});
  }}
}}

// POST /api/admin/{module} — create
export async function POST(req: Request) {{
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({{ error: auth.error }}, {{ status: auth.status }});
  if (auth.admin.role === "View") return NextResponse.json({{ error: "Read-only role" }}, {{ status: 403 }});
  try {{
    const body = await req.json();
    const item = await db.{model}.create({{ data: body }});
    return NextResponse.json({{ item }});
  }} catch (e: any) {{
    return NextResponse.json({{ error: e?.message || "Create failed" }}, {{ status: 500 }});
  }}
}}
'''

# Generate each
for module, model, search_fields, has_archived, filter_fields in MODULES:
    f = ROOT / module / "route.ts"
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(gen_route(module, model, search_fields, has_archived, filter_fields))
    print(f"✅ {module}/route.ts")

print(f"\n✅ Regenerated {len(MODULES)} list endpoints with pagination")
