import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/insights/business — business-level KPIs (revenue, customers,
// suppliers, products, riders, branches). Used by the Insights dashboard.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const [bookings, customers, suppliers, products, riders, branches, cities, zones, services] = await Promise.all([
      db.booking.count(),
      db.customer.count(),
      db.supplier.count(),
      db.product.count(),
      db.rider.count(),
      db.branch.count({ where: { archived: false } }),
      db.city.count({ where: { archived: false } }),
      db.zone.count(),
      db.service.count(),
    ]);

    const [activeRiders, onlineRiders, activeProducts, activeServices] = await Promise.all([
      db.rider.count({ where: { status: "Active" } }),
      db.rider.count({ where: { isOnline: true } }),
      db.product.count({ where: { status: "Active" } }),
      db.service.count({ where: { status: "Active" } }),
    ]);

    return NextResponse.json({
      ok: true,
      totals: {
        bookings,
        customers,
        suppliers,
        products,
        riders,
        branches,
        cities,
        zones,
        services,
      },
      active: {
        riders: activeRiders,
        onlineRiders,
        products: activeProducts,
        services: activeServices,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Business insights failed" }, { status: 500 });
  }
}
