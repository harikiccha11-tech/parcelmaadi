import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/insights/report — printable summary report (last 30 days).
// Combines KPIs, top services, top customers, cancellation rate, etc.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const summary: any[] = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS bookings,
        COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE status IN ('Delivered', 'Completed'))::int AS delivered,
        COALESCE(SUM(final_estimate) FILTER (WHERE status != 'Cancelled'), 0)::float AS revenue,
        COALESCE(AVG(final_estimate) FILTER (WHERE status != 'Cancelled'), 0)::float AS avg_value
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;
    const topServices: any[] = await db.$queryRaw`
      SELECT s.name AS service, COUNT(b.id)::int AS bookings,
             COALESCE(SUM(b.final_estimate), 0)::float AS revenue
      FROM "Service" s
      LEFT JOIN "Booking" b ON b.service_id = s.id
        AND b.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY s.id, s.name
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const topCustomers: any[] = await db.$queryRaw`
      SELECT c.name, c.mobile, COUNT(b.id)::int AS bookings,
             COALESCE(SUM(b.final_estimate), 0)::float AS spend
      FROM "Customer" c
      JOIN "Booking" b ON b.customer_id = c.id
      WHERE b.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY c.id, c.name, c.mobile
      ORDER BY spend DESC
      LIMIT 10
    `;
    const topVehicles: any[] = await db.$queryRaw`
      SELECT v.name AS vehicle, COUNT(b.id)::int AS bookings
      FROM "Vehicle" v
      LEFT JOIN "Booking" b ON b.vehicle_id = v.id
        AND b.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY v.id, v.name
      ORDER BY bookings DESC
      LIMIT 10
    `;

    const s = summary[0] || {};
    return NextResponse.json({
      ok: true,
      window: "30d",
      generatedAt: new Date().toISOString(),
      summary: {
        bookings: s.bookings || 0,
        cancelled: s.cancelled || 0,
        delivered: s.delivered || 0,
        revenue: s.revenue || 0,
        avgValue: s.avg_value || 0,
        cancellationRate: s.bookings > 0 ? Math.round((s.cancelled / s.bookings) * 1000) / 10 : 0,
        completionRate: s.bookings > 0 ? Math.round((s.delivered / s.bookings) * 1000) / 10 : 0,
      },
      topServices,
      topCustomers,
      topVehicles,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Report failed" }, { status: 500 });
  }
}
