import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const allowed = ["code", "description", "discountType", "discountValue", "minOrderAmount", "maxDiscount", "usageLimit", "validFrom", "validUntil", "status"];
  const data: any = {};
  for (const k of allowed) {
    if (k in body) {
      data[k] = ["discountValue", "minOrderAmount", "maxDiscount", "usageLimit"].includes(k) ? Number(body[k]) : body[k];
    }
  }
  const coupon = await db.coupon.update({ where: { id: Number(id) }, data });
  return NextResponse.json({ coupon });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "View-only role" }, { status: 403 });
  const { id } = await params;
  await db.coupon.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
