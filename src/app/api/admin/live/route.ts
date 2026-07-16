import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/admin/live — live bookings for the dispatch / tracking board.
// Returns bookings that are currently active (New/Confirmed/Assigned/Picked Up/In Progress).
// Includes customer + service + vehicle + rider + GPS for map rendering.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const active = await db.booking.findMany({
      where: {
        status: { in: ["New", "Confirmed", "Assigned", "Picked Up", "In Progress"] },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        service: { select: { id: true, name: true, slug: true, icon: true } },
        customer: { select: { id: true, name: true, mobile: true } },
        vehicle: { select: { id: true, name: true, maxLoad: true } },
        rider: { select: { id: true, name: true, mobile: true, currentLat: true, currentLng: true, isOnline: true } },
      },
    });

    const onlineRiders = await db.rider.findMany({
      where: { isOnline: true, status: "Active" },
      select: {
        id: true, name: true, mobile: true,
        currentLat: true, currentLng: true,
        vehicleType: true, vehicleNumber: true,
        rating: true, totalDeliveries: true,
      },
      take: 200,
    });

    const emergencies = active.filter((b) => b.isEmergency).length;

    return NextResponse.json({
      ok: true,
      active,
      onlineRiders,
      stats: {
        active: active.length,
        emergencies,
        onlineRiders: onlineRiders.length,
        new: active.filter((b) => b.status === "New").length,
        confirmed: active.filter((b) => b.status === "Confirmed").length,
        assigned: active.filter((b) => b.status === "Assigned").length,
        inTransit: active.filter((b) => b.status === "Picked Up" || b.status === "In Progress").length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Live fetch failed" }, { status: 500 });
  }
}
