import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emitRealtime } from "@/lib/realtime";

// PATCH /api/admin/bookings/{id}/assign-driver — set driver name & mobile + type (rider/driver/supplier)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const { driverName, driverMobile, driverType } = await req.json();
  if (!driverName || !driverMobile) return NextResponse.json({ error: "driverName and driverMobile required" }, { status: 400 });

  const booking = await db.booking.findUnique({ where: { id: Number(id) } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const newStatus = booking.status === "New" || booking.status === "Pending" || booking.status === "Confirmed" ? "Assigned" : booking.status;
  const updated = await db.booking.update({
    where: { id: booking.id },
    data: { driverName, driverMobile, driverType: driverType || "Driver", status: newStatus },
  });
  if (newStatus !== booking.status) {
    await db.statusHistory.create({
      data: { bookingId: booking.id, oldStatus: booking.status, newStatus, changedBy: auth.admin.email, notes: `${driverType || "Driver"} assigned: ${driverName} (${driverMobile})` },
    });
  }
  await emitRealtime("booking:assign", { id: booking.id, bookingId: booking.bookingId, driverName, driverMobile, driverType: driverType || "Driver", status: newStatus });
  return NextResponse.json({ booking: updated });
}
