import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/dashboard — premium KPIs + chart data + live widgets
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

    // Parallel queries for performance
    const [
      totalBookings, todayBookings, pendingCount, confirmedCount, inProgressCount,
      deliveredCount, cancelledCount, emergencyCount, marketplaceCount,
      todayRevenue, monthRevenue, activeRiders, activeVendors, activeBranches,
      customers, products, lowStockProducts, recentBookings, recentPayments,
      bookingsForChart, servicesForChart, ridersForChart, vendorsForChart,
      branchesForChart, pendingApprovals, allBookingsForMap,
    ] = await Promise.all([
      // KPIs
      db.booking.count(),
      db.booking.count({ where: { createdAt: { gte: todayStart } } }),
      db.booking.count({ where: { status: "New" } }),
      db.booking.count({ where: { status: "Confirmed" } }),
      db.booking.count({ where: { status: { in: ["Assigned", "Picked Up", "In Progress"] } } }),
      db.booking.count({ where: { status: { in: ["Delivered", "Completed"] } } }),
      db.booking.count({ where: { status: "Cancelled" } }),
      db.booking.count({ where: { isEmergency: true } }),
      db.booking.count({ where: { supplierId: { not: null } } }),
      db.booking.aggregate({ _sum: { finalEstimate: true }, where: { createdAt: { gte: todayStart }, status: { not: "Cancelled" } } }),
      db.booking.aggregate({ _sum: { finalEstimate: true }, where: { createdAt: { gte: monthStart }, status: { not: "Cancelled" } } }),
      db.rider.count({ where: { isOnline: true, status: "Active" } }),
      db.supplier.count({ where: { status: "Approved" } }),
      db.branch.count({ where: { status: "Active", archived: false } }),
      db.customer.count(),
      db.product.count({ where: { status: "Active" } }),
      db.product.count({ where: { stock: { lt: 10 }, status: "Active" } }),
      // Recent widgets
      db.booking.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { service: true, customer: true } }),
      db.payment.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { booking: true } }),
      // Charts
      db.$queryRaw`SELECT DATE(b.created_at) as date, COUNT(*)::int as count, COALESCE(SUM(b.final_estimate), 0)::float as revenue
                    FROM "Booking" b WHERE b.created_at >= ${since}
                    GROUP BY DATE(b.created_at) ORDER BY DATE(b.created_at)` as Promise<any[]>,
      db.service.findMany({ include: { _count: { select: { bookings: true } } } }),
      db.rider.findMany({ take: 10, orderBy: { totalDeliveries: "desc" }, select: { id: true, name: true, totalDeliveries: true, totalEarnings: true, rating: true } }),
      db.supplier.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { id: true, shopName: true, supplierType: true, status: true, commissionPercent: true } }),
      db.branch.findMany({ take: 10, select: { id: true, name: true, code: true, city: true, status: true } }),
      // Pending approvals
      Promise.all([
        db.supplier.count({ where: { status: "Pending" } }),
        db.product.count({ where: { status: "Pending" } }),
        db.supportTicket.count({ where: { status: "Open" } }),
        db.settlement.count({ where: { status: "Pending" } }),
      ]),
      // Map: active bookings with GPS
      db.booking.findMany({
        where: { status: { in: ["Assigned", "Picked Up", "In Progress"] }, pickupLat: { not: null } },
        take: 50,
        select: { id: true, bookingId: true, status: true, pickupLat: true, pickupLng: true, dropLat: true, dropLng: true, serviceId: true },
      }),
    ]);

    const [pendingSuppliers, pendingProducts, pendingTickets, pendingSettlements] = pendingApprovals;

    // Service usage chart data
    const serviceUsage = servicesForChart.map((s) => ({
      name: s.name,
      bookings: s._count.bookings,
    }));

    // Rider performance
    const riderPerformance = ridersForChart.map((r) => ({
      name: r.name,
      deliveries: r.totalDeliveries,
      earnings: r.totalEarnings,
      rating: r.rating,
    }));

    // Vendor performance
    const vendorPerformance = vendorsForChart.map((v) => ({
      name: v.shopName,
      type: v.supplierType,
      status: v.status,
      commission: v.commissionPercent,
    }));

    // Branch performance
    const branchPerformance = branchesForChart.map((b) => ({
      name: b.name,
      code: b.code,
      city: b.city,
      status: b.status,
    }));

    return NextResponse.json({
      // KPI cards
      kpis: {
        totalBookings,
        todayBookings,
        pending: pendingCount,
        assigned: confirmedCount,
        pickedUp: inProgressCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        emergency: emergencyCount,
        marketplace: marketplaceCount,
        revenueToday: todayRevenue._sum.finalEstimate || 0,
        revenueThisMonth: monthRevenue._sum.finalEstimate || 0,
        activeRiders,
        activeVendors,
        activeBranches,
        customers,
        products,
        inventoryAlerts: lowStockProducts,
      },
      // Pending approvals
      pendingApprovals: {
        suppliers: pendingSuppliers,
        products: pendingProducts,
        tickets: pendingTickets,
        settlements: pendingSettlements,
      },
      // Charts
      charts: {
        daily: bookingsForChart.map((b) => ({ date: b.date, count: b.count, revenue: b.revenue })),
        serviceUsage,
        riderPerformance,
        vendorPerformance,
        branchPerformance,
      },
      // Live widgets
      recentBookings,
      recentPayments,
      // Map
      activeBookings: allBookingsForMap,
      // System health
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
