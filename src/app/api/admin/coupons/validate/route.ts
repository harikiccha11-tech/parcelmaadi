import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/admin/coupons/validate — validate a coupon against an order amount
// Public-ish: used by customer checkout. Returns discount or error.
export async function POST(req: Request) {
  const { code, orderAmount } = await req.json();
  if (!code) return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
  const coupon = await db.coupon.findUnique({ where: { code: String(code).toUpperCase().trim() } });
  if (!coupon || coupon.status !== "Active") return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) return NextResponse.json({ error: "Coupon not yet active" }, { status: 400 });
  if (coupon.validUntil && now > coupon.validUntil) return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  const amt = Number(orderAmount) || 0;
  if (amt < coupon.minOrderAmount) return NextResponse.json({ error: `Minimum order ₹${coupon.minOrderAmount} required` }, { status: 400 });
  let discount = coupon.discountType === "flat" ? coupon.discountValue : Math.round((amt * coupon.discountValue) / 100);
  if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  return NextResponse.json({ ok: true, coupon: { code: coupon.code, description: coupon.description, discountType: coupon.discountType, discountValue: coupon.discountValue }, discount });
}
