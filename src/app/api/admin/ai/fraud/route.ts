import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/ai/fraud — fraud-detection signals.
// Rule-based, no external AI:
//  1. Same mobile, multiple bookings within 1 hour (spam)
//  2. Customer with 5+ cancellations (suspicious)
//  3. Booking with final_estimate > ₹50,000 (high-value review)
//  4. Admin with > 100 actions in 1 hour (insider activity)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const spamBookings: any[] = await db.$queryRaw`
      SELECT mobile, COUNT(*)::int AS bookings, MAX(created_at) AS last_at
      FROM "Booking" b
      JOIN "Customer" c ON c.id = b.customer_id
      WHERE b.created_at >= NOW() - INTERVAL '1 hour'
      GROUP BY mobile
      HAVING COUNT(*) >= 3
      ORDER BY bookings DESC
      LIMIT 10
    `;
    const suspiciousCancellations: any[] = await db.$queryRaw`
      SELECT c.name, c.mobile, COUNT(b.id)::int AS cancelled
      FROM "Customer" c
      JOIN "Booking" b ON b.customer_id = c.id
      WHERE b.status = 'Cancelled'
      GROUP BY c.id, c.name, c.mobile
      HAVING COUNT(b.id) >= 5
      ORDER BY cancelled DESC
      LIMIT 10
    `;
    const highValueBookings: any[] = await db.$queryRaw`
      SELECT booking_id, final_estimate, status, created_at,
             (SELECT name FROM "Customer" WHERE id = b.customer_id) AS customer_name
      FROM "Booking" b
      WHERE final_estimate >= 50000
      ORDER BY final_estimate DESC
      LIMIT 10
    `;
    const busyAdmins: any[] = await db.$queryRaw`
      SELECT admin_email, COUNT(*)::int AS actions
      FROM "AuditLog"
      WHERE created_at >= NOW() - INTERVAL '1 hour'
        AND admin_email IS NOT NULL
      GROUP BY admin_email
      HAVING COUNT(*) >= 100
      ORDER BY actions DESC
      LIMIT 10
    `;

    const signals: { kind: string; severity: "LOW" | "MEDIUM" | "HIGH"; subjectName: string; detail: string }[] = [];

    for (const s of spamBookings) {
      signals.push({
        kind: "Spam bookings",
        severity: "HIGH",
        subjectName: s.mobile,
        detail: `${s.bookings} bookings from this mobile in the last hour.`,
      });
    }
    for (const c of suspiciousCancellations) {
      signals.push({
        kind: "High cancellations",
        severity: "MEDIUM",
        subjectName: c.name || c.mobile,
        detail: `${c.cancelled} cancelled bookings — review pattern.`,
      });
    }
    for (const b of highValueBookings) {
      signals.push({
        kind: "High-value booking",
        severity: "MEDIUM",
        subjectName: b.booking_id,
        detail: `₹${Math.round(b.final_estimate).toLocaleString("en-IN")} — verify payment & delivery.`,
      });
    }
    for (const a of busyAdmins) {
      signals.push({
        kind: "Admin activity spike",
        severity: "HIGH",
        subjectName: a.admin_email,
        detail: `${a.actions} admin actions in the last hour.`,
      });
    }

    return NextResponse.json({
      ok: true,
      signals,
      count: signals.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "AI fraud failed" }, { status: 500 });
  }
}
