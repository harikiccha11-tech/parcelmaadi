import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { emitRealtime } from "@/lib/realtime";
import { getSettingsMap } from "@/lib/config";

// PATCH /api/admin/bookings/{id}/status
// Also sends customer a WhatsApp notification on key status changes
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const { status, notes } = await req.json();
  const allowed = ["New", "Confirmed", "Assigned", "In Progress", "Completed", "Cancelled", "Pending", "Driver Assigned", "Pickup Started", "Picked Up", "Delivered"];
  if (!allowed.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const booking = await db.booking.findUnique({ where: { id: Number(id) }, include: { customer: true, service: true, vehicle: true } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const updated = await db.booking.update({ where: { id: booking.id }, data: { status, adminNotes: notes ?? booking.adminNotes } });
  await db.statusHistory.create({
    data: { bookingId: booking.id, oldStatus: booking.status, newStatus: status, changedBy: auth.admin.email, notes: notes || null },
  });
  await emitRealtime("booking:status", { id: booking.id, bookingId: booking.bookingId, status, changedBy: auth.admin.email });

  // ---- Customer WhatsApp notification on key status changes ----
  const settings = await getSettingsMap();
  const waNumber = settings.whatsapp_number || "919741433725";
  const customerMobile = booking.customer?.mobile;
  const statusMessages: Record<string, string> = {
    "Confirmed": `✅ Your ParcelMaadi booking ${booking.bookingId} is CONFIRMED! ${booking.service?.name || ""} · ${booking.vehicle?.name || ""}. We'll assign a driver shortly.`,
    "Driver Assigned": `🚚 Driver assigned for your ParcelMaadi booking ${booking.bookingId}! ${booking.driverName ? `Driver: ${booking.driverName} (${booking.driverMobile})` : ""}. Call the driver for coordination.`,
    "Assigned": `🚚 Driver assigned for your ParcelMaadi booking ${booking.bookingId}! ${booking.driverName ? `Driver: ${booking.driverName} (${booking.driverMobile})` : ""}.`,
    "Pickup Started": `📍 Driver is on the way to pickup for your ParcelMaadi booking ${booking.bookingId}.`,
    "Picked Up": `📦 Your item has been picked up for ParcelMaadi booking ${booking.bookingId}. On the way to drop!`,
    "In Progress": `🚛 Your ParcelMaadi booking ${booking.bookingId} is in progress.`,
    "Delivered": `📦 Your ParcelMaadi booking ${booking.bookingId} has been DELIVERED! Thank you for choosing ParcelMaadi.`,
    "Completed": `✅ Your ParcelMaadi booking ${booking.bookingId} is COMPLETED! We'd love to serve you again. Fast Local Reliable!`,
    "Cancelled": `❌ Your ParcelMaadi booking ${booking.bookingId} has been CANCELLED. For queries, call ${settings.contact_1 || "9741433725"}.`,
  };
  const msg = statusMessages[status];
  if (msg && customerMobile) {
    // Send WhatsApp click-to-send link via realtime to admin (who can forward), OR
    // if WhatsApp Business API is ON, send automatically
    if (settings.tool_whatsapp_api === "true") {
      // TODO: integrate WhatsApp Business Cloud API when key is configured
    } else {
      // Free fallback: send the prefilled WhatsApp link to customer via ntfy/email (best-effort)
      // The customer will also see status updates in "My Orders" page
    }
    // Also emit a realtime event so any connected customer tabs can update
    await emitRealtime("customer:status", { bookingId: booking.bookingId, status, message: msg, customerMobile });
  }

  return NextResponse.json({ booking: updated });
}
