import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/dashboard — premium KPIs + chart data + live widgets
// Optimized: sequential queries to avoid connection pool exhaustion
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days") || 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Run queries sequentially (small batches) to avoid pool exhaustion on Supabase free tier (1 connection)
    const kpis: any = {};

    // Batch 1: Booking counts
    kpis.totalBookings = await db.booking.count();
    kpis.todayBookings = await db.booking.count({ where: { createdAt: { gte: todayStart } } });
    kpis.pending = await db.booking.count({ where: { status: "New" } });
    kpis.assigned = await db.booking.count({ where: { status: "Confirmed" } });
    kpis.pickedUp = await db.booking.count({ where: { status: { in: ["Assigned", "Picked Up", "In Progress"] } } });
    kpis.delivered = await db.booking.count({ where: { status: { in: ["Delivered", "Completed"] } } });
    kpis.cancelled = await db.booking.count({ where: { status: "Cancelled" } });
    kpis.emergency = await db.booking.count({ where: { isEmergency: true } });
    kpis.marketplace = await db.booking.count({ where: { supplierId: { not: null } } });

    // Batch 2: Revenue
    const todayRev = await db.booking.aggregate({
      _sum: { finalEstimate: true },
      where: { createdAt: { gte: todayStart }, status: { not: "Cancelled" } },
    });
    const monthRev = await db.booking.aggregate({
      _sum: { finalEstimate: true },
      where: { createdAt: { gte: monthStart }, status: { not: "Cancelled" } },
    });
    kpis.revenueToday = todayRev._sum.finalEstimate || 0;
    kpis.revenueThisMonth = monthRev._sum.finalEstimate || 0;

    // Batch 3: Other entities
    kpis.activeRiders = await db.rider.count({ where: { isOnline: true, status: "Active" } }).catch(() => 0);
    kpis.activeVendors = await db.supplier.count({ where: { status: "Approved" } });
    kpis.activeBranches = await db.branch.count({ where: { status: "Active", archived: false } }).catch(() => 0);
    kpis.customers = await db.customer.count();
    kpis.products = await db.product.count({ where: { status: "Active" } });
    kpis.inventoryAlerts = await db.product.count({ where: { stock: { lt: 10 }, status: "Active" } });

    // Batch 4: Recent widgets
    const recentBookings = await db.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { service: true, customer: true },
    });
    const recentPayments = await db.payment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { booking: true },
    });

    // Batch 5: Charts (use raw SQL — single query)
    let bookingsForChart: any[] = [];
    try {
      bookingsForChart = await db.$queryRaw`SELECT DATE(b.created_at) as date, COUNT(*)::int as count, COALESCE(SUM(b.final_estimate), 0)::float as revenue
                    FROM "Booking" b WHERE b.created_at >= ${since}
                    GROUP BY DATE(b.created_at) ORDER BY DATE(b.created_at)`;
    } catch (e) {
      // Fallback: empty chart
    }

    // Batch 6: Service usage
    const services = await db.service.findMany({ include: { _count: { select: { bookings: true } } } });
    const serviceUsage = services.map((s) => ({ name: s.name, bookings: s._count.bookings }));

    // Batch 7: Rider/vendor/branch performance
    const riderPerformance = await db.rider.findMany({
      take: 10,
      orderBy: { totalDeliveries: "desc" },
      select: { id: true, name: true, totalDeliveries: true, totalEarnings: true, rating: true },
    }).catch(() => []);

    const vendors = await db.supplier.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, shopName: true, supplierType: true, status: true, commissionPercent: true },
    });
    const vendorPerformance = vendors.map((v) => ({
      name: v.shopName, type: v.supplierType, status: v.status, commission: v.commissionPercent,
    }));

    const branches = await db.branch.findMany({
      take: 10,
      select: { id: true, name: true, code: true, city: true, status: true },
    }).catch(() => []);
    const branchPerformance = branches.map((b) => ({
      name: b.name, code: b.code, city: b.city, status: b.status,
    }));

    // Batch 8: Pending approvals
    const pendingSuppliers = await db.supplier.count({ where: { status: "Pending" } });
    const pendingProducts = await db.product.count({ where: { status: "Pending" } });
    const pendingTickets = await db.supportTicket.count({ where: { status: "Open" } }).catch(() => 0);
    const pendingSettlements = await db.settlement.count({ where: { status: "Pending" } }).catch(() => 0);

    // Batch 9: Active bookings for map
    const activeBookings = await db.booking.findMany({
      where: { status: { in: ["Assigned", "Picked Up", "In Progress"] }, pickupLat: { not: null } },
      take: 50,
      select: { id: true, bookingId: true, status: true, pickupLat: true, pickupLng: true, dropLat: true, dropLng: true, serviceId: true },
    });

    return NextResponse.json({
      kpis,
      pendingApprovals: {
        suppliers: pendingSuppliers,
        products: pendingProducts,
        tickets: pendingTickets,
        settlements: pendingSettlements,
      },
      charts: {
        daily: bookingsForChart.map((b: any) => ({ date: b.date, count: b.count, revenue: b.revenue })),
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
    });
  } catch (e: any) {
    console.error("Dashboard error:", e);
    return NextResponse.json({ error: e?.message || "Failed to load dashboard" }, { status: 500 });
  }
}
