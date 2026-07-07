import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseListParams, paginatedResponse } from "@/lib/list-utils";

// GET /api/admin/notifications — paginated list with search + filters
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { where, page, limit, skip, take, sortBy, sortOrder } = parseListParams(req, {
      searchFields: ['channel', 'recipient', 'subject'],
      filterFields: ['status'],
      hasArchived: false,
      defaultSortBy: "id",
    });

    const [items, total] = await Promise.all([
      db.notificationLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
      }),
      db.notificationLog.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/admin/notifications — create
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const item = await db.notificationLog.create({ data: body });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}
