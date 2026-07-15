import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews — customer reviews derived from bookings.
// Reviews model is on the v1.1 roadmap — meanwhile we derive a proxy from
// completed bookings (bookings = implicit "trusted" customer; we surface
// post-delivery sentiment via the customer notes field).
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const reviews = await db.$queryRaw`
      SELECT
        b.id AS booking_id,
        b.booking_id AS booking_number,
        b.customer_notes,
        b.admin_notes,
        b.status,
        b.final_estimate,
        b.created_at,
        b.delivered_at,
        c.name AS customer_name,
        c.mobile AS customer_mobile,
        s.name AS service_name,
        r.name AS rider_name,
        r.rating AS rider_rating
      FROM "Booking" b
      JOIN "Customer" c ON c.id = b.customer_id
      JOIN "Service" s ON s.id = b.service_id
      LEFT JOIN "Rider" r ON r.id = b.rider_id
      WHERE b.status IN ('Delivered', 'Completed')
        AND (b.customer_notes IS NOT NULL OR r.rating IS NOT NULL)
      ORDER BY b.created_at DESC
      LIMIT 50
    ` as any[];

    return NextResponse.json({
      ok: true,
      reviews,
      count: reviews.length,
      note: "Reviews model is on the v1.1 roadmap — meanwhile derived from completed bookings.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Reviews fetch failed" }, { status: 500 });
  }
}
