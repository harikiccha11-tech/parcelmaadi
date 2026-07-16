import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Razorpay from "razorpay";

// POST /api/payments/razorpay/create — create a Razorpay order for a booking
// Body: { bookingId: "PM-20260706-9506" }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const booking = await db.booking.findFirst({
      where: { bookingId },
      include: { service: true, customer: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const amount = Math.round((booking.adminFinalAmount || booking.finalEstimate) * 100); // Razorpay uses paise

    // Check if Razorpay keys are configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      // Fallback: return UPI payment details for manual payment
      return NextResponse.json({
        mode: "upi",
        bookingId: booking.bookingId,
        amount: amount / 100,
        upiId: process.env.UPI_ID || "9538110059@ybl",
        payeeName: "HariPrasad N P (HP Enterprise)",
        message: "Razorpay not configured. Pay via UPI and upload screenshot.",
      });
    }

    // Create Razorpay order
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: booking.bookingId,
      notes: {
        bookingId: booking.bookingId,
        customer: booking.customer?.name || "Unknown",
        service: booking.service?.name || "Unknown",
      },
    });

    // Save order ID to booking
    await db.booking.update({
      where: { id: booking.id },
      data: {
        paymentOption: "Razorpay",
        paymentStatus: "Pending",
      },
    });

    // Create payment record
    await db.payment.create({
      data: {
        bookingId: booking.id,
        amount: amount / 100,
        paymentOption: "Razorpay",
        paymentStatus: "Pending",
      },
    });

    return NextResponse.json({
      mode: "razorpay",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
      bookingId: booking.bookingId,
      customerName: booking.customer?.name,
      customerEmail: booking.customer?.email,
      customerMobile: booking.customer?.mobile,
    });
  } catch (e: any) {
    console.error("Razorpay create error:", e);
    return NextResponse.json({ error: e?.message || "Payment creation failed" }, { status: 500 });
  }
}
