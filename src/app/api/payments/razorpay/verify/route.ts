import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

// POST /api/payments/razorpay/verify — verify Razorpay payment signature
// Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 500 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Payment verified — update booking
    const booking = await db.booking.findFirst({ where: { bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await db.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: "Paid",
        paymentReceived: booking.adminFinalAmount || booking.finalEstimate,
      },
    });

    // Update payment record
    await db.payment.updateMany({
      where: { bookingId: booking.id, paymentStatus: "Pending" },
      data: {
        paymentStatus: "Verified",
        verifiedBy: "Razorpay",
        verifiedAt: new Date(),
      },
    });

    // Create status history
    await db.statusHistory.create({
      data: {
        bookingId: booking.id,
        oldStatus: booking.status,
        newStatus: booking.status,
        changedBy: "Razorpay",
        notes: `Payment verified — ₹${booking.adminFinalAmount || booking.finalEstimate} via Razorpay (ID: ${razorpayPaymentId})`,
      },
    });

    return NextResponse.json({
      verified: true,
      bookingId: booking.bookingId,
      amount: booking.adminFinalAmount || booking.finalEstimate,
      paymentId: razorpayPaymentId,
    });
  } catch (e: any) {
    console.error("Razorpay verify error:", e);
    return NextResponse.json({ error: e?.message || "Verification failed" }, { status: 500 });
  }
}
