import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/bookings — list, search and filter bookings
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const limit = Number(url.searchParams.get("limit") || 100);

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { bookingId: { contains: q } },
      { customer: { mobile: { contains: q } } },
      { customer: { name: { contains: q } } },
      { pickupAddress: { contains: q } },
      { dropAddress: { contains: q } },
    ];
  }

  const bookings = await db.booking.findMany({
    where,
    orderBy: [{ isEmergency: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { service: true, vehicle: true, customer: true, supplier: true, payments: true },
  });

  return NextResponse.json({ bookings });
}
