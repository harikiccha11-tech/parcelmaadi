import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/reports?period=daily|weekly|monthly|yearly&from=&to=
// Returns aggregated: totals, service-wise, vehicle-wise, zone-wise, status-wise, revenue/profit/GST
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "monthly";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const now = new Date();
  let gte: Date;
  if (from) gte = new Date(from);
  else {
    gte = new Date(now);
    if (period === "daily") gte.setDate(now.getDate() - 1);
    else if (period === "weekly") gte.setDate(now.getDate() - 7);
    else if (period === "monthly") gte.setMonth(now.getMonth() - 1);
    else if (period === "yearly") gte.setFullYear(now.getFullYear() - 1);
    else gte = new Date(0);
  }
  const lte = to ? new Date(to + "T23:59:59") : now;

  const bookings = await db.booking.findMany({
    where: { createdAt: { gte, lte } },
    include: { service: true, vehicle: true, customer: true, supplier: true },
  });

  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === "Completed" || b.status === "Delivered");
  const cancelled = bookings.filter((b) => b.status === "Cancelled");
  const revenue = bookings.reduce((s, b) => s + (b.finalEstimate || 0), 0);
  const realized = bookings.reduce((s, b) => s + (b.paymentReceived || 0), 0);
  const pending = revenue - realized;
  const gst = bookings.reduce((s, b) => {
    try { const fs = JSON.parse(b.fareSnapshotJson); return s + (fs.breakup?.gst || 0); } catch { return s; }
  }, 0);
  const commission = bookings.reduce((s, b) => {
    try { const fs = JSON.parse(b.fareSnapshotJson); return s + (fs.breakup?.commissionAmount || 0); } catch { return s; }
  }, 0);
  const discount = bookings.reduce((s, b) => s + (b.discountApplied || 0) + (b.couponDiscount || 0), 0);

  // service-wise
  const svcMap: Record<string, { count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    const k = b.service?.name || "Unknown";
    svcMap[k] = svcMap[k] || { count: 0, revenue: 0 };
    svcMap[k].count++; svcMap[k].revenue += b.finalEstimate || 0;
  });
  // vehicle-wise
  const vehMap: Record<string, { count: number; revenue: number }> = {};
  bookings.forEach((b) => {
    const k = b.vehicle?.name || b.itemDetails || "Unknown";
    vehMap[k] = vehMap[k] || { count: 0, revenue: 0 };
    vehMap[k].count++; vehMap[k].revenue += b.finalEstimate || 0;
  });
  // status-wise
  const statusMap: Record<string, number> = {};
  bookings.forEach((b) => { statusMap[b.status] = (statusMap[b.status] || 0) + 1; });
  // payment-status-wise
  const payMap: Record<string, number> = {};
  bookings.forEach((b) => { payMap[b.paymentStatus] = (payMap[b.paymentStatus] || 0) + 1; });

  return NextResponse.json({
    period, from: gte, to: lte,
    total, completed: completed.length, cancelled: cancelled.length,
    revenue, realized, pending, gst, commission, discount,
    profit: commission, // profit = commission earned
    serviceWise: Object.entries(svcMap).map(([k, v]) => ({ name: k, ...v })),
    vehicleWise: Object.entries(vehMap).map(([k, v]) => ({ name: k, ...v })),
    statusWise: Object.entries(statusMap).map(([k, v]) => ({ status: k, count: v })),
    paymentWise: Object.entries(payMap).map(([k, v]) => ({ paymentStatus: k, count: v })),
  });
}
