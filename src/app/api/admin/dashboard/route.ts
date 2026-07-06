import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/dashboard — KPI cards
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalBookings,
    todayBookings,
    pendingCount,
    confirmedCount,
    driverAssignedCount,
    inProgressCount,
    deliveredCount,
    completedCount,
    cancelledCount,
    serviceCounts,
    paidPayments,
    allBookings,
  ] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { createdAt: { gte: today } } }),
    db.booking.count({ where: { status: "Pending" } }),
    db.booking.count({ where: { status: "Confirmed" } }),
    db.booking.count({ where: { status: "Driver Assigned" } }),
    db.booking.count({ where: { status: "In Progress" } }),
    db.booking.count({ where: { status: "Delivered" } }),
    db.booking.count({ where: { status: "Completed" } }),
    db.booking.count({ where: { status: "Cancelled" } }),
    db.booking.groupBy({ by: ["serviceId"], _count: true }),
    db.payment.findMany({ where: { paymentStatus: { in: ["Verified", "Full Paid", "Advance Paid"] } } }),
    db.booking.findMany({ select: { finalEstimate: true, paymentStatus: true, status: true } }),
  ]);

  const totalEstimate = allBookings.reduce((s, b) => s + (b.finalEstimate || 0), 0);
  const paidAmount = paidPayments.reduce((s, p) => s + (p.amount || 0), 0);

  // resolve service names
  const services = await db.service.findMany();
  const svcNameMap: Record<number, string> = {};
  for (const s of services) svcNameMap[s.id] = s.name;
  const serviceWise = serviceCounts.map((sc) => ({
    serviceId: sc.serviceId,
    name: svcNameMap[sc.serviceId] || `#${sc.serviceId}`,
    count: sc._count,
  }));

  return NextResponse.json({
    totalBookings,
    todayBookings,
    pendingCount,
    confirmedCount,
    driverAssignedCount,
    inProgressCount,
    deliveredCount,
    completedCount,
    cancelledCount,
    totalEstimate,
    paidAmount,
    serviceWise,
  });
}
