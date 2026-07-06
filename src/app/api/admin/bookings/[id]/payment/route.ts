import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emitRealtime } from "@/lib/realtime";

// PATCH /api/admin/bookings/{id}/payment — verify payment or mark cash; also edit final amount + received
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const body = await req.json();
  const { paymentStatus, adminFinalAmount, paymentReceived } = body;

  const booking = await db.booking.findUnique({ where: { id: Number(id) } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const data: any = {};
  if (paymentStatus) {
    const allowed = ["Pending", "Advance Paid", "Full Paid", "Cash", "Failed", "Verified", "Refund Required"];
    if (!allowed.includes(paymentStatus)) return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
    data.paymentStatus = paymentStatus;
  }
  if (adminFinalAmount != null) data.adminFinalAmount = Number(adminFinalAmount);
  if (paymentReceived != null) data.paymentReceived = Number(paymentReceived);

  const updated = await db.booking.update({ where: { id: booking.id }, data });

  if (paymentStatus) {
    const existingPayment = await db.payment.findFirst({ where: { bookingId: booking.id } });
    if (existingPayment) {
      await db.payment.update({
        where: { id: existingPayment.id },
        data: { paymentStatus, verifiedBy: auth.admin.email, verifiedAt: new Date() },
      });
    } else {
      await db.payment.create({
        data: {
          bookingId: booking.id,
          amount: adminFinalAmount != null ? Number(adminFinalAmount) : booking.finalEstimate,
          paymentOption: booking.paymentOption || "Cash",
          paymentStatus,
          verifiedBy: auth.admin.email,
          verifiedAt: new Date(),
        },
      });
    }
  }
  await emitRealtime("payment:verify", { id: booking.id, bookingId: booking.bookingId, paymentStatus: data.paymentStatus || booking.paymentStatus });
  return NextResponse.json({ booking: updated });
}
