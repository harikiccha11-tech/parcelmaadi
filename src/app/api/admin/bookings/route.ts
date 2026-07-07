import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/bookings — paginated list with search + filter
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { bookingId: { contains: q, mode: "insensitive" } },
      { customer: { mobile: { contains: q } } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { pickupAddress: { contains: q, mode: "insensitive" } },
      { dropAddress: { contains: q, mode: "insensitive" } },
    ];
  }

  const [bookings, total] = await Promise.all([
    db.booking.findMany({
      where,
      orderBy: [{ isEmergency: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: { service: true, vehicle: true, customer: true, supplier: true, payments: true },
    }),
    db.booking.count({ where }),
  ]);

  return NextResponse.json({
    items: bookings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  });
}
