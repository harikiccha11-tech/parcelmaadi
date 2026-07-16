import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/ai/fare — fare recommendation multiplier.
// Rule-based: looks at open demand (active bookings) vs supply (online riders).
// Returns { multiplier, reason, openDemand, availableRiders, pressure }
// where pressure = openDemand / max(1, availableRiders).
// No external AI calls, no data leaves the server.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const [openDemand, availableRiders] = await Promise.all([
      db.booking.count({
        where: { status: { in: ["New", "Confirmed", "Assigned", "Picked Up", "In Progress"] } },
      }),
      db.rider.count({ where: { isOnline: true, status: "Active" } }),
    ]);

    const supply = Math.max(1, availableRiders);
    const pressure = openDemand / supply;

    let multiplier = 1.0;
    let reason = "Normal demand — no surge applied.";

    if (pressure >= 4) {
      multiplier = 1.4;
      reason = "Very high demand vs supply — 1.4× surge recommended.";
    } else if (pressure >= 2.5) {
      multiplier = 1.25;
      reason = "High demand vs supply — 1.25× surge recommended.";
    } else if (pressure >= 1.5) {
      multiplier = 1.1;
      reason = "Moderate demand pressure — 1.1× surge recommended.";
    } else if (pressure < 0.5 && openDemand < 3) {
      multiplier = 0.95;
      reason = "Low demand — 5% discount recommended to stimulate bookings.";
    }

    return NextResponse.json({
      ok: true,
      multiplier,
      reason,
      openDemand,
      availableRiders,
      pressure: Math.round(pressure * 100) / 100,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "AI fare failed" }, { status: 500 });
  }
}
