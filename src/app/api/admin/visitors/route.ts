import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseListParams, paginatedResponse } from "@/lib/list-utils";

// GET /api/admin/visitors — list all visitors (admin only)
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days") || 7);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const { where, page, limit, skip, take, sortBy, sortOrder } = parseListParams(req, {
      searchFields: ["ip", "city", "country", "device", "page"],
      filterFields: ["device", "country", "city"],
      hasArchived: false,
      defaultSortBy: "createdAt",
    });

    // Add date filter
    where.createdAt = { gte: since };

    const [items, total] = await Promise.all([
      db.visitor.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true, ip: true, city: true, region: true, country: true,
          device: true, page: true, referrer: true, localTime: true,
          userAgent: true, createdAt: true,
        },
      }),
      db.visitor.count({ where }),
    ]);

    // Also get summary stats
    const [totalVisitors, todayVisitors, uniqueIPs, byDevice, byCity] = await Promise.all([
      db.visitor.count({ where: { createdAt: { gte: since } } }),
      db.visitor.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.visitor.groupBy({
        by: ["ip"],
        where: { createdAt: { gte: since }, ip: { not: "unknown" } },
        _count: { id: true },
      }),
      db.visitor.groupBy({
        by: ["device"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.visitor.groupBy({
        by: ["city"],
        where: { createdAt: { gte: since }, city: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      ...paginatedResponse(items, total, page, limit),
      stats: {
        totalVisitors,
        todayVisitors,
        uniqueIPs: uniqueIPs.length,
        byDevice: byDevice.map(d => ({ name: d.device || "Unknown", count: d._count.id })),
        byCity: byCity.map(c => ({ name: c.city || "Unknown", count: c._count.id })),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
