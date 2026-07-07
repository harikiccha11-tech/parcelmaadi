import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const body = await req.json();
  const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, validFrom, validUntil, status } = body || {};
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });
  const coupon = await db.coupon.create({
    data: {
      code: String(code).toUpperCase().trim(), description: description || null,
      discountType: discountType || "percent", discountValue: Number(discountValue) || 0,
      minOrderAmount: Number(minOrderAmount) || 0, maxDiscount: Number(maxDiscount) || 0,
      usageLimit: Number(usageLimit) || 0, validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null, status: status || "Active",
    },
  });
  return NextResponse.json({ coupon });
}
