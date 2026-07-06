import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

// POST /api/bookings/{bookingId}/cancel — customer can cancel before admin confirms
export async function POST(_req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await db.booking.findFirst({ where: { bookingId } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  // Only allow cancel before confirmed/assigned
  if (["Confirmed", "Assigned", "In Progress", "Completed", "Pickup Started", "Picked Up", "Delivered"].includes(booking.status)) {
    return NextResponse.json({ error: `Cannot cancel a booking that is already ${booking.status}. Please call support.` }, { status: 400 });
  }
  const updated = await db.booking.update({ where: { id: booking.id }, data: { status: "Cancelled" } });
  await db.statusHistory.create({ data: { bookingId: booking.id, oldStatus: booking.status, newStatus: "Cancelled", changedBy: "customer", notes: "Cancelled by customer" } });
  await emitRealtime("booking:status", { id: booking.id, bookingId: booking.bookingId, status: "Cancelled", changedBy: "customer" });
  return NextResponse.json({ booking: updated });
}
