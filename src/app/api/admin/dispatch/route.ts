import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/dispatch — dispatch board: unassigned + in-progress bookings.
// ?status=New|Assigned|... — filter by booking status (default: all active).
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["New", "Confirmed", "Assigned", "Picked Up", "In Progress"];

  try {
    const [queue, riders] = await Promise.all([
      db.booking.findMany({
        where: { status: { in: statuses } },
        orderBy: [{ isEmergency: "desc" }, { createdAt: "asc" }],
        take: 100,
        include: {
          service: { select: { id: true, name: true, slug: true, icon: true } },
          customer: { select: { id: true, name: true, mobile: true } },
          vehicle: { select: { id: true, name: true, maxLoad: true } },
          rider: { select: { id: true, name: true, mobile: true, isOnline: true } },
        },
      }),
      db.rider.findMany({
        where: { status: "Active" },
        select: {
          id: true, name: true, mobile: true,
          vehicleType: true, vehicleNumber: true,
          isOnline: true, rating: true, totalDeliveries: true,
          currentLat: true, currentLng: true,
        },
        orderBy: [{ isOnline: "desc" }, { name: "asc" }],
        take: 100,
      }),
    ]);

    return NextResponse.json({
      ok: true,
      queue,
      riders,
      stats: {
        total: queue.length,
        unassigned: queue.filter((b) => !b.riderId).length,
        assigned: queue.filter((b) => b.riderId).length,
        emergencies: queue.filter((b) => b.isEmergency).length,
        onlineRiders: riders.filter((r) => r.isOnline).length,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Dispatch fetch failed" }, { status: 500 });
  }
}
