import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/insights/series — daily booking + revenue series for charts.
// ?days=30 (default 30, max 180)
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 180);

  try {
    const series: any[] = await db.$queryRaw`
      SELECT
        DATE(b.created_at) AS date,
        COUNT(*)::int AS bookings,
        COUNT(*) FILTER (WHERE b.status = 'Cancelled')::int AS cancelled,
        COALESCE(SUM(b.final_estimate) FILTER (WHERE b.status != 'Cancelled'), 0)::float AS revenue,
        COALESCE(AVG(b.final_estimate) FILTER (WHERE b.status != 'Cancelled'), 0)::float AS avg_value
      FROM "Booking" b
      WHERE b.created_at >= NOW() - make_interval(days => ${days})
      GROUP BY DATE(b.created_at)
      ORDER BY DATE(b.created_at)
    `;

    return NextResponse.json({ ok: true, days, series });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Series failed" }, { status: 500 });
  }
}
