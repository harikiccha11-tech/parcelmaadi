import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/crm/leads — derived "leads" from waitlist + recent customers.
// Reuses existing Waitlist and Customer tables — no new schema needed.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const waitlist = await db.waitlist.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const recentCustomers: any[] = await db.$queryRaw`
      SELECT c.id, c.name, c.mobile, c.email, c.created_at,
             COUNT(b.id)::int AS bookings
      FROM "Customer" c
      LEFT JOIN "Booking" b ON b.customer_id = c.id
      WHERE c.created_at >= NOW() - INTERVAL '14 days'
      GROUP BY c.id, c.name, c.mobile, c.email, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 50
    `;

    // Treat each waitlist entry + new customer as a "lead" — sales team can follow up.
    const leads = [
      ...waitlist.map((w) => ({
        id: `wl_${w.id}`,
        source: "waitlist",
        sourcePage: w.sourcePage,
        contact: w.contact,
        contactType: w.contactType,
        createdAt: w.createdAt,
        status: "new",
      })),
      ...recentCustomers.map((c: any) => ({
        id: `cu_${c.id}`,
        source: "signup",
        contact: c.mobile || c.email,
        contactType: c.email ? "email" : "phone",
        name: c.name,
        bookings: c.bookings,
        createdAt: c.created_at,
        status: c.bookings > 0 ? "converted" : "new",
      })),
    ];

    return NextResponse.json({
      ok: true,
      leads,
      count: leads.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "CRM leads failed" }, { status: 500 });
  }
}
