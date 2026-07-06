import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/bookings/{bookingId} — get booking status for customer
export async function GET(_req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await db.booking.findFirst({
    where: { bookingId },
    include: { service: true, vehicle: true, customer: true, statusHistory: { orderBy: { createdAt: "asc" } }, payments: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  return NextResponse.json({ booking });
}
