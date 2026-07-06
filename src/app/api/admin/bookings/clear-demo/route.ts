import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/bookings/clear-demo — delete all bookings/customers/payments/status-history (keeps master data)
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role !== "Owner") return NextResponse.json({ error: "Only Owner role can clear demo data" }, { status: 403 });
  await db.statusHistory.deleteMany();
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.customer.deleteMany();
  return NextResponse.json({ ok: true, message: "All demo bookings cleared. Master data (services, vehicles, prices) preserved." });
}
