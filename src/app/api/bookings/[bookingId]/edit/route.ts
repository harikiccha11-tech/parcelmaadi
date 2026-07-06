import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitRealtime } from "@/lib/realtime";

// PATCH /api/bookings/{bookingId}/edit — customer can edit notes/schedule before admin confirms
export async function PATCH(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await db.booking.findFirst({ where: { bookingId } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (["Confirmed", "Assigned", "In Progress", "Completed", "Pickup Started", "Picked Up", "Delivered"].includes(booking.status)) {
    return NextResponse.json({ error: `Cannot edit a booking that is already ${booking.status}.` }, { status: 400 });
  }
  const body = await req.json();
  const allowed = ["scheduleDate", "scheduleTime", "itemDetails", "weight", "quantity", "customerNotes", "landmark"];
  const data: any = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  const updated = await db.booking.update({ where: { id: booking.id }, data });
  await db.statusHistory.create({ data: { bookingId: booking.id, oldStatus: booking.status, newStatus: booking.status, changedBy: "customer", notes: "Booking edited by customer" } });
  await emitRealtime("booking:update", { id: booking.id, bookingId: booking.bookingId });
  return NextResponse.json({ booking: updated });
}
