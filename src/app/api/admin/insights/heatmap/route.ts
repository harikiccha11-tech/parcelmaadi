import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/insights/heatmap — booking heatmap by city × hour.
// Returns a sparse grid of {city, hour, count} for the last 30 days.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const grid = await db.$queryRaw`
      SELECT
        COALESCE(NULLIF(SPLIT_PART(pickup_address, ',', 1), ''), 'Unknown') AS city,
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*)::int AS bookings
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND pickup_address IS NOT NULL
      GROUP BY city, hour
      ORDER BY bookings DESC
      LIMIT 200
    `;
    return NextResponse.json({ ok: true, grid });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Heatmap failed" }, { status: 500 });
  }
}
