import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettingsMap } from "@/lib/config";

// GET /api/admin/bookings/{id}/invoice — returns invoice data for PDF/print
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id: Number(id) },
    include: { service: true, vehicle: true, customer: true, payments: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const settings = await getSettingsMap();
  let fareSnapshot: any = {};
  try { fareSnapshot = JSON.parse(booking.fareSnapshotJson); } catch {}
  const breakup = fareSnapshot.breakup || {};
  const invoice = {
    invoiceNo: `INV-${booking.bookingId}`,
    bookingId: booking.bookingId,
    date: booking.createdAt,
    status: booking.status,
    customer: booking.customer,
    service: booking.service?.name,
    vehicle: booking.vehicle?.name,
    pickup: { address: booking.pickupAddress, lat: booking.pickupLat, lng: booking.pickupLng, mapLink: booking.pickupMapLink },
    drop: { address: booking.dropAddress, lat: booking.dropLat, lng: booking.dropLng, mapLink: booking.dropMapLink },
    distanceKm: booking.distanceKm,
    etaText: booking.etaText,
    itemDetails: booking.itemDetails,
    weight: booking.weight,
    quantity: booking.quantity,
    breakup,
    finalEstimate: booking.finalEstimate,
    adminFinalAmount: booking.adminFinalAmount,
    discountApplied: booking.discountApplied,
    paymentOption: booking.paymentOption,
    paymentStatus: booking.paymentStatus,
    paymentReceived: booking.paymentReceived,
    driverName: booking.driverName,
    driverMobile: booking.driverMobile,
    company: {
      brand: settings.brand_name || "ParcelMaadi",
      legalName: settings.company_name || "HP Enterprise",
      gstin: settings.gstin || "29ANZPH4067Q1ZS",
      email: settings.email || "parcelmaadipm@gmail.com",
      contact: settings.contact_1 || "9741433725",
      upi: settings.upi_id || "parcelmaadi@upi",
    },
  };
  return NextResponse.json({ invoice });
}
