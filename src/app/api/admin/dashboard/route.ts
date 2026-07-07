import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Simple in-memory cache (30 second TTL) to survive rapid refreshes
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

// GET /api/admin/dashboard — premium KPIs + chart data + live widgets
// SINGLE SQL query for all counts to avoid connection pool exhaustion
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Return cached data if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true, cachedAt: cache.ts });
  }

  try {
    // SINGLE raw SQL query to get all booking counts in one shot
    const stats: any[] = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS total_bookings,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()))::int AS today_bookings,
        COUNT(*) FILTER (WHERE status = 'New')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'Confirmed')::int AS assigned,
        COUNT(*) FILTER (WHERE status IN ('Assigned', 'Picked Up', 'In Progress'))::int AS picked_up,
        COUNT(*) FILTER (WHERE status IN ('Delivered', 'Completed'))::int AS delivered,
        COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE is_emergency = true)::int AS emergency,
        COUNT(*) FILTER (WHERE supplier_id IS NOT NULL)::int AS marketplace,
        COALESCE(SUM(final_estimate) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) AND status != 'Cancelled'), 0)::float AS revenue_today,
        COALESCE(SUM(final_estimate) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW()) AND status != 'Cancelled'), 0)::float AS revenue_month
      FROM "Booking"
    `;

    const s = stats[0] || {};

    // Single query for daily chart
    let daily: any[] = [];
    try {
      daily = await db.$queryRaw`
        SELECT DATE(b.created_at) as date, COUNT(*)::int as count, COALESCE(SUM(b.final_estimate), 0)::float as revenue
        FROM "Booking" b
        WHERE b.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(b.created_at)
        ORDER BY DATE(b.created_at)
      `;
    } catch {}

    // Single query for service usage
    const serviceUsage: any[] = await db.$queryRaw`
      SELECT s.name, COUNT(b.id)::int AS bookings
      FROM "Service" s
      LEFT JOIN "Booking" b ON b.service_id = s.id
      GROUP BY s.id, s.name
      ORDER BY bookings DESC
    `;

    // Single query for other counts
    const otherCounts: any[] = await db.$queryRaw`
      SELECT
        (SELECT COUNT(*) FROM "Rider" WHERE is_online = true AND status = 'Active')::int AS active_riders,
        (SELECT COUNT(*) FROM "Supplier" WHERE status = 'Approved')::int AS active_vendors,
        (SELECT COUNT(*) FROM "Branch" WHERE status = 'Active' AND archived = false)::int AS active_branches,
        (SELECT COUNT(*) FROM "Customer")::int AS customers,
        (SELECT COUNT(*) FROM "Product" WHERE status = 'Active')::int AS products,
        (SELECT COUNT(*) FROM "Product" WHERE stock < 10 AND status = 'Active')::int AS inventory_alerts,
        (SELECT COUNT(*) FROM "Supplier" WHERE status = 'Pending')::int AS pending_suppliers,
        (SELECT COUNT(*) FROM "Product" WHERE status = 'Pending')::int AS pending_products,
        (SELECT COUNT(*) FROM "SupportTicket" WHERE status = 'Open')::int AS pending_tickets,
        (SELECT COUNT(*) FROM "Settlement" WHERE status = 'Pending')::int AS pending_settlements
    `;
    const o = otherCounts[0] || {};

    // Recent bookings (just 5)
    const recentBookings = await db.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { service: true, customer: true },
    });

    // Recent payments (just 5)
    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { booking: true },
    });

    // Top vendors (just 5)
    const vendorPerformance: any[] = await db.$queryRaw`
      SELECT shop_name AS name, supplier_type AS type, status, commission_percent AS commission
      FROM "Supplier"
      ORDER BY created_at DESC
      LIMIT 5
    `;

    // Top riders (just 5)
    let riderPerformance: any[] = [];
    try {
      riderPerformance = await db.$queryRaw`
        SELECT name, total_deliveries AS deliveries, total_earnings AS earnings, rating
        FROM "Rider"
        ORDER BY total_deliveries DESC
        LIMIT 5
      `;
    } catch {}

    // Top branches (just 5)
    let branchPerformance: any[] = [];
    try {
      branchPerformance = await db.$queryRaw`
        SELECT name, code, city, status
        FROM "Branch"
        WHERE archived = false
        LIMIT 5
      `;
    } catch {}

    // Active bookings for map
    const activeBookings = await db.booking.findMany({
      where: { status: { in: ["Assigned", "Picked Up", "In Progress"] }, pickupLat: { not: null } },
      take: 50,
      select: { id: true, bookingId: true, status: true, pickupLat: true, pickupLng: true, dropLat: true, dropLng: true, serviceId: true },
    });

    const data = {
      kpis: {
        totalBookings: s.total_bookings || 0,
        todayBookings: s.today_bookings || 0,
        pending: s.pending || 0,
        assigned: s.assigned || 0,
        pickedUp: s.picked_up || 0,
        delivered: s.delivered || 0,
        cancelled: s.cancelled || 0,
        emergency: s.emergency || 0,
        marketplace: s.marketplace || 0,
        revenueToday: s.revenue_today || 0,
        revenueThisMonth: s.revenue_month || 0,
        activeRiders: o.active_riders || 0,
        activeVendors: o.active_vendors || 0,
        activeBranches: o.active_branches || 0,
        customers: o.customers || 0,
        products: o.products || 0,
        inventoryAlerts: o.inventory_alerts || 0,
      },
      pendingApprovals: {
        suppliers: o.pending_suppliers || 0,
        products: o.pending_products || 0,
        tickets: o.pending_tickets || 0,
        settlements: o.pending_settlements || 0,
      },
      charts: {
        daily,
        serviceUsage,
        riderPerformance,
        vendorPerformance,
        branchPerformance,
      },
      recentBookings,
      recentPayments,
      activeBookings,
      systemHealth: {
        db: "ok",
        api: "ok",
        lastChecked: new Date().toISOString(),
      },
    };

    // Update cache
    cache = { data, ts: Date.now() };

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ error: e?.message || "Failed to load dashboard" }, { status: 500 });
  }
}
