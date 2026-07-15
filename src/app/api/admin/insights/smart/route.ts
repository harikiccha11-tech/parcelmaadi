import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/insights/smart — short list of derived "smart" observations.
// Each observation is a numeric threshold + human label. No free-text AI.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const stats = await db.$queryRaw`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()))::int AS today,
        COUNT(*) FILTER (WHERE status = 'New')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'Cancelled')::int AS cancelled,
        COUNT(*) FILTER (WHERE is_emergency = true)::int AS emergency,
        COALESCE(SUM(final_estimate) FILTER (WHERE created_at >= DATE_TRUNC('day', NOW()) AND status != 'Cancelled'), 0)::float AS revenue_today
      FROM "Booking"
    ` as any[];
    const s = stats[0] || {};

    const observations: { kind: string; title: string; detail: string; severity: "info" | "warn" | "good" }[] = [];

    if (s.pending > 5) {
      observations.push({
        kind: "queue",
        title: `${s.pending} new bookings pending`,
        detail: "Above the 5-booking threshold — dispatch may need attention.",
        severity: "warn",
      });
    } else {
      observations.push({
        kind: "queue",
        title: `${s.pending} new bookings pending`,
        detail: "Within normal range.",
        severity: "info",
      });
    }

    if (s.emergency > 0) {
      observations.push({
        kind: "emergency",
        title: `${s.emergency} emergency bookings`,
        detail: "Review surge pricing and rider allocation.",
        severity: "warn",
      });
    }

    if (s.revenue_today > 0) {
      observations.push({
        kind: "revenue",
        title: `₹${Math.round(s.revenue_today).toLocaleString("en-IN")} revenue today`,
        detail: `From ${s.today} bookings.`,
        severity: "good",
      });
    }

    const cancelRate = s.total > 0 ? Math.round((s.cancelled / s.total) * 1000) / 10 : 0;
    observations.push({
      kind: "cancellation",
      title: `Cancellation rate: ${cancelRate}%`,
      detail: cancelRate > 15 ? "Above threshold — investigate." : "Healthy.",
      severity: cancelRate > 15 ? "warn" : "good",
    });

    return NextResponse.json({ ok: true, observations });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Smart insights failed" }, { status: 500 });
  }
}
