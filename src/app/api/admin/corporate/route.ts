import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/corporate — corporate accounts overview.
// Reuses existing Customer + Booking data grouped by domain/email to identify
// potential corporate accounts (multiple bookings from same email domain).
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const corporateCandidates = await db.$queryRaw`
      SELECT
        SPLIT_PART(c.email, '@', 2) AS domain,
        COUNT(DISTINCT c.id)::int AS users,
        COUNT(b.id)::int AS bookings,
        COALESCE(SUM(b.final_estimate) FILTER (WHERE b.status != 'Cancelled'), 0)::float AS revenue,
        MAX(b.created_at) AS last_booking_at
      FROM "Customer" c
      LEFT JOIN "Booking" b ON b.customer_id = c.id
      WHERE c.email IS NOT NULL AND c.email LIKE '%@%'
        AND SPLIT_PART(c.email, '@', 2) NOT IN ('gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com', 'icloud.com', 'live.com')
      GROUP BY domain
      HAVING COUNT(b.id) >= 1
      ORDER BY revenue DESC
      LIMIT 20
    ` as any[];

    return NextResponse.json({
      ok: true,
      candidates: corporateCandidates,
      count: corporateCandidates.length,
      note: "Derived from existing customer bookings — corporate-account model is on the v1.1 roadmap.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Corporate fetch failed" }, { status: 500 });
  }
}
