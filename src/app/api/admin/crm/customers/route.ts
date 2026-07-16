import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/crm/customers — customer list with booking stats (CRM view).
// ?take=50 (max 200) ?search=name|mobile
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 50, 1), 200);
  const search = url.searchParams.get("search")?.trim();

  try {
    let customers: any[];
    if (search) {
      customers = await db.$queryRaw`
        SELECT
          c.id, c.name, c.mobile, c.email, c.created_at,
          COUNT(b.id)::int AS bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'Cancelled')::int AS cancelled,
          COUNT(b.id) FILTER (WHERE b.status IN ('Delivered', 'Completed'))::int AS delivered,
          COALESCE(SUM(b.final_estimate) FILTER (WHERE b.status != 'Cancelled'), 0)::float AS total_spend,
          MAX(b.created_at) AS last_booking_at
        FROM "Customer" c
        LEFT JOIN "Booking" b ON b.customer_id = c.id
        WHERE c.name ILIKE ${"%" + search + "%"} OR c.mobile ILIKE ${"%" + search + "%"}
        GROUP BY c.id, c.name, c.mobile, c.email, c.created_at
        ORDER BY total_spend DESC
        LIMIT ${take}
      `;
    } else {
      customers = await db.$queryRaw`
        SELECT
          c.id, c.name, c.mobile, c.email, c.created_at,
          COUNT(b.id)::int AS bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'Cancelled')::int AS cancelled,
          COUNT(b.id) FILTER (WHERE b.status IN ('Delivered', 'Completed'))::int AS delivered,
          COALESCE(SUM(b.final_estimate) FILTER (WHERE b.status != 'Cancelled'), 0)::float AS total_spend,
          MAX(b.created_at) AS last_booking_at
        FROM "Customer" c
        LEFT JOIN "Booking" b ON b.customer_id = c.id
        GROUP BY c.id, c.name, c.mobile, c.email, c.created_at
        ORDER BY total_spend DESC NULLS LAST
        LIMIT ${take}
      `;
    }

    return NextResponse.json({
      ok: true,
      customers,
      count: customers.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "CRM customers failed" }, { status: 500 });
  }
}
