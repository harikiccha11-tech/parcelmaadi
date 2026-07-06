import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/activity — admin activity log (Owner only)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role !== "Owner") return NextResponse.json({ error: "Only Owner can view activity log" }, { status: 403 });
  const logs = await db.adminActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { name: true, email: true, role: true } } },
  });
  return NextResponse.json({ logs });
}
