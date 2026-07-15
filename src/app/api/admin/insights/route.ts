import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 5-minute in-memory cache — survives rapid refreshes
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

// GET /api/admin/insights — high-level business insights for the new admin v2.
// Aggregates existing Booking / Product / Customer / Rider data into KPIs,
// trends, and "smart" observations. No new schema required.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true, cachedAt: cache.ts });
  }

  try {
    const bookingStats: any[] = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()))::int AS today,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', NOW()))::int AS this_week,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()))::int AS this_month,
        COUNT(*) FILTER (WHERE status IN ('Delivered', 'Completed'))::int AS delivered,
        COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE is_emergency = true)::int AS emergency,
        COALESCE(SUM(final_estimate) FILTER (WHERE status != 'Cancelled'), 0)::float AS revenue,
        COALESCE(SUM(final_estimate) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) AND status != 'Cancelled'), 0)::float AS revenue_month,
        COALESCE(AVG(final_estimate) FILTER (WHERE status != 'Cancelled'), 0)::float AS avg_booking_value
      FROM "Booking"
    `;
    const revenueByService: any[] = await db.$queryRaw`
      SELECT s.name AS service,
             COUNT(b.id)::int AS bookings,
             COALESCE(SUM(b.final_estimate), 0)::float AS revenue
      FROM "Service" s
      LEFT JOIN "Booking" b ON b.service_id = s.id
      GROUP BY s.id, s.name
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const topCustomers: any[] = await db.$queryRaw`
      SELECT c.name, c.mobile, COUNT(b.id)::int AS bookings,
             COALESCE(SUM(b.final_estimate), 0)::float AS spend
      FROM "Customer" c
      JOIN "Booking" b ON b.customer_id = c.id
      GROUP BY c.id, c.name, c.mobile
      ORDER BY spend DESC
      LIMIT 5
    `;
    const hourlyDistribution: any[] = await db.$queryRaw`
      SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS bookings
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY hour
      ORDER BY hour
    `;
    const cityDistribution: any[] = await db.$queryRaw`
      SELECT COALESCE(pickup_address, 'Unknown') AS city, COUNT(*)::int AS bookings
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY city
      ORDER BY bookings DESC
      LIMIT 8
    `;
    const vehicleUtilisation: any[] = await db.$queryRaw`
      SELECT v.name AS vehicle, s.name AS service, COUNT(b.id)::int AS bookings
      FROM "Vehicle" v
      JOIN "Service" s ON s.id = v.service_id
      LEFT JOIN "Booking" b ON b.vehicle_id = v.id
      GROUP BY v.id, v.name, s.name
      ORDER BY bookings DESC
      LIMIT 10
    `;
    const recentAudit = await db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, module: true, adminEmail: true, createdAt: true, entityType: true },
    });

    const s = bookingStats[0] || {};
    const cancellationRate = s.total > 0 ? Math.round((s.cancelled / s.total) * 1000) / 10 : 0;
    const completionRate = s.total > 0 ? Math.round((s.delivered / s.total) * 1000) / 10 : 0;

    // Smart observations — derived from the numbers, not free-text AI
    const insights: { kind: "positive" | "warning" | "neutral"; title: string; detail: string }[] = [];
    if (s.emergency > 0) {
      insights.push({
        kind: "warning",
        title: `${s.emergency} emergency bookings`,
        detail: `${s.emergency} emergency bookings received — review surge and rider allocation.`,
      });
    }
    if (cancellationRate > 15) {
      insights.push({
        kind: "warning",
        title: `Cancellation rate ${cancellationRate}%`,
        detail: "Above the 15% threshold — investigate top cancellation reasons and rider ETA accuracy.",
      });
    } else if (cancellationRate < 5 && s.total > 10) {
      insights.push({
        kind: "positive",
        title: `Low cancellation rate (${cancellationRate}%)`,
        detail: "Below 5% — customer experience is healthy.",
      });
    }
    if (s.avg_booking_value > 0) {
      insights.push({
        kind: "neutral",
        title: `Average booking value ₹${Math.round(s.avg_booking_value).toLocaleString("en-IN")}`,
        detail: "Computed across all non-cancelled bookings.",
      });
    }
    if (revenueByService[0]?.revenue > 0) {
      insights.push({
        kind: "positive",
        title: `Top service: ${revenueByService[0].service}`,
        detail: `₹${Math.round(revenueByService[0].revenue).toLocaleString("en-IN")} revenue · ${revenueByService[0].bookings} bookings.`,
      });
    }

    const peakHour = hourlyDistribution.reduce(
      (max: any, h: any) => (h.bookings > (max?.bookings ?? 0) ? h : max),
      null as any
    );

    const data = {
      kpis: {
        totalBookings: s.total || 0,
        todayBookings: s.today || 0,
        thisWeek: s.this_week || 0,
        thisMonth: s.this_month || 0,
        delivered: s.delivered || 0,
        cancelled: s.cancelled || 0,
        emergency: s.emergency || 0,
        revenue: s.revenue || 0,
        revenueMonth: s.revenue_month || 0,
        avgBookingValue: s.avg_booking_value || 0,
        cancellationRate,
        completionRate,
      },
      revenueByService,
      topCustomers,
      hourlyDistribution,
      peakHour,
      cityDistribution,
      vehicleUtilisation,
      recentAudit,
      insights,
      generatedAt: new Date().toISOString(),
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json({ ok: true, ...data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Insights failed" }, { status: 500 });
  }
}
