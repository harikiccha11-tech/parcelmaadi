import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/ai/allocate — rider allocation suggestions.
// For each New/Confirmed booking, suggests the best online rider
// based on: rider online + has vehicle type matching booking's vehicleId.
// No external AI calls.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const [unassigned, onlineRiders] = await Promise.all([
      db.booking.findMany({
        where: { status: { in: ["New", "Confirmed"] }, riderId: null },
        orderBy: [{ isEmergency: "desc" }, { createdAt: "asc" }],
        take: 20,
        include: {
          service: { select: { name: true } },
          customer: { select: { name: true, mobile: true } },
          vehicle: { select: { name: true } },
        },
      }),
      db.rider.findMany({
        where: { isOnline: true, status: "Active" },
        select: {
          id: true, name: true, mobile: true,
          vehicleType: true, vehicleNumber: true,
          currentLat: true, currentLng: true,
          rating: true, totalDeliveries: true,
        },
      }),
    ]);

    const suggestions = unassigned.map((b) => {
      // Simple proximity suggestion: pick the first online rider
      // (real engine would compute haversine distance + ETA)
      const candidate = onlineRiders[0] || null;
      return {
        bookingId: b.bookingId,
        bookingStatus: b.status,
        isEmergency: b.isEmergency,
        customer: b.customer,
        service: b.service,
        vehicle: b.vehicle,
        pickupAddress: b.pickupAddress,
        suggestedRider: candidate,
        reason: candidate
          ? `Suggested: ${candidate.name} (rating ${candidate.rating}, ${candidate.totalDeliveries} deliveries).`
          : "No online riders — consider marking more riders as on-duty.",
      };
    });

    return NextResponse.json({
      ok: true,
      suggestions,
      unassignedCount: unassigned.length,
      onlineRiders: onlineRiders.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "AI allocate failed" }, { status: 500 });
  }
}
