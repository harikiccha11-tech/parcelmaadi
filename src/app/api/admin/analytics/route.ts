import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 10-minute cache — analytics doesn't need minute-freshness
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

// GET /api/admin/analytics — customer-facing analytics: traffic sources,
// visitor geography, device split, popular pages. Uses existing Visitor table.
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true, cachedAt: cache.ts });
  }

  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 7, 1), 90);

  try {
    const visitors: any[] = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS total,
        COUNT(DISTINCT session_id)::int AS unique_sessions,
        COUNT(DISTINCT ip)::int AS unique_ips
      FROM "Visitor"
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
    `;
    const topCities: any[] = await db.$queryRaw`
      SELECT COALESCE(city, 'Unknown') AS city, COUNT(*)::int AS visits
      FROM "Visitor"
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY city
      ORDER BY visits DESC
      LIMIT 10
    `;
    const topPages: any[] = await db.$queryRaw`
      SELECT COALESCE(page, '/') AS page, COUNT(*)::int AS visits
      FROM "Visitor"
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY page
      ORDER BY visits DESC
      LIMIT 10
    `;
    const deviceSplit: any[] = await db.$queryRaw`
      SELECT COALESCE(device, 'Unknown') AS device, COUNT(*)::int AS visits
      FROM "Visitor"
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY device
      ORDER BY visits DESC
    `;
    const referrerSplit: any[] = await db.$queryRaw`
      SELECT COALESCE(referrer, 'Direct') AS referrer, COUNT(*)::int AS visits
      FROM "Visitor"
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 8
    `;
    const hourlyTraffic: any[] = await db.$queryRaw`
      SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS visits
      FROM "Visitor"
      WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY hour
      ORDER BY hour
    `;

    const data = {
      ok: true,
      window: `${days}d`,
      visitors: visitors[0] || { total: 0, unique_sessions: 0, unique_ips: 0 },
      topCities,
      topPages,
      deviceSplit,
      referrerSplit,
      hourlyTraffic,
      generatedAt: new Date().toISOString(),
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Analytics failed" }, { status: 500 });
  }
}
