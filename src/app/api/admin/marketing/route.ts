import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/marketing — marketing overview.
// Reuses existing Offer, Coupon, Banner, Waitlist data — no new schema needed.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const [offers, coupons, banners, waitlistCount] = await Promise.all([
      db.offer.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.coupon.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.banner.findMany({
        orderBy: { sortOrder: "asc" },
        take: 20,
      }),
      db.waitlist.count(),
    ]);
    const waitlistByDay: any[] = await db.$queryRaw`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS signups
      FROM "Waitlist"
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `;

    const activeOffers = offers.filter((o) => o.status === "Active").length;
    const activeCoupons = coupons.filter((c) => c.status === "Active").length;
    const activeBanners = banners.filter((b) => b.status === "Active").length;

    return NextResponse.json({
      ok: true,
      summary: {
        activeOffers,
        activeCoupons,
        activeBanners,
        waitlistCount,
      },
      offers,
      coupons,
      banners,
      waitlistByDay,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Marketing fetch failed" }, { status: 500 });
  }
}
