import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/ai/insights — plain-English business insights derived from data.
// Returns an array of {kind, title, detail} — computed from live metrics.
// No external AI calls.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const stats: any[] = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()))::int AS today,
        COUNT(*) FILTER (WHERE status = 'New')::int AS pending,
        COUNT(*) FILTER (WHERE is_emergency = true)::int AS emergency,
        COALESCE(SUM(final_estimate) FILTER (WHERE status != 'Cancelled'), 0)::float AS revenue
      FROM "Booking"
    `;
    const topService: any[] = await db.$queryRaw`
      SELECT s.name, COUNT(b.id)::int AS bookings,
             COALESCE(SUM(b.final_estimate), 0)::float AS revenue
      FROM "Service" s
      LEFT JOIN "Booking" b ON b.service_id = s.id
      GROUP BY s.id, s.name
      ORDER BY revenue DESC
      LIMIT 1
    `;
    const topCity: any[] = await db.$queryRaw`
      SELECT COALESCE(NULLIF(SPLIT_PART(pickup_address, ',', 1), ''), 'Unknown') AS city,
             COUNT(*)::int AS bookings
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '30 days' AND pickup_address IS NOT NULL
      GROUP BY city
      ORDER BY bookings DESC
      LIMIT 1
    `;
    const topVehicle: any[] = await db.$queryRaw`
      SELECT v.name AS vehicle, COUNT(b.id)::int AS bookings
      FROM "Vehicle" v
      LEFT JOIN "Booking" b ON b.vehicle_id = v.id
      GROUP BY v.id, v.name
      ORDER BY bookings DESC
      LIMIT 1
    `;
    const recentCancellationRate: any[] = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;

    const s = stats[0] || {};
    const insights: { kind: string; title: string; detail: string }[] = [];

    if (s.revenue > 0) {
      insights.push({
        kind: "revenue",
        title: `Total revenue: ₹${Math.round(s.revenue).toLocaleString("en-IN")}`,
        detail: `Across ${s.total} bookings (lifetime).`,
      });
    }
    if (s.pending > 5) {
      insights.push({
        kind: "operations",
        title: `${s.pending} new bookings need attention`,
        detail: "Above the 5-booking threshold — dispatch may need reinforcement.",
      });
    }
    if (s.emergency > 0) {
      insights.push({
        kind: "alert",
        title: `${s.emergency} emergency bookings active`,
        detail: "Surge pricing may apply; review rider allocation.",
      });
    }
    if (topService[0]?.revenue > 0) {
      insights.push({
        kind: "leader",
        title: `Top service: ${topService[0].name}`,
        detail: `${topService[0].bookings} bookings · ₹${Math.round(topService[0].revenue).toLocaleString("en-IN")} revenue.`,
      });
    }
    if (topCity[0]?.bookings > 0) {
      insights.push({
        kind: "geography",
        title: `Top city: ${topCity[0].city}`,
        detail: `${topCity[0].bookings} bookings in the last 30 days.`,
      });
    }
    if (topVehicle[0]?.bookings > 0) {
      insights.push({
        kind: "vehicle",
        title: `Top vehicle: ${topVehicle[0].vehicle}`,
        detail: `${topVehicle[0].bookings} bookings — consider adding more capacity.`,
      });
    }
    const cancelRate = recentCancellationRate[0]?.total > 0
      ? Math.round((recentCancellationRate[0].cancelled / recentCancellationRate[0].total) * 1000) / 10
      : 0;
    insights.push({
      kind: "quality",
      title: `7-day cancellation rate: ${cancelRate}%`,
      detail: cancelRate > 15 ? "Above 15% threshold — investigate." : "Within healthy range.",
    });

    return NextResponse.json({
      ok: true,
      insights,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "AI insights failed" }, { status: 500 });
  }
}
