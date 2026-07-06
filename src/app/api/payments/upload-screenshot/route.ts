import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/payments/upload-screenshot
// Accepts multipart form with bookingId + file, stores screenshot reference,
// updates booking paymentScreenshotUrl and creates a payment record.
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const bookingId = formData.get("bookingId") as string;
    const file = formData.get("file") as File | null;
    if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const booking = await db.booking.findFirst({ where: { bookingId } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // For MVP demo: store as a data URL so it is viewable without object storage.
    // In production this would upload to S3/Supabase storage and store the URL.
    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const dataUrl = `data:${file.type || "image/png"};base64,${base64}`;

    await db.booking.update({
      where: { id: booking.id },
      data: { paymentScreenshotUrl: dataUrl, paymentStatus: "Advance Paid" },
    });

    await db.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.finalEstimate,
        paymentOption: booking.paymentOption || "UPI",
        paymentStatus: "Pending",
        screenshotUrl: dataUrl,
      },
    });

    return NextResponse.json({ ok: true, screenshotUrl: dataUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
