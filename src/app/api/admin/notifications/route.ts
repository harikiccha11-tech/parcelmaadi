import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/notifications — list all NotificationLogs
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const archived = url.searchParams.get("archived") === "true";
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");
    const limit = Number(url.searchParams.get("limit") || 200);

    const where: any = {};
    // archived filter not applicable for this model
    if (status && "status" in db.notificationLog.fields) where.status = status;
    

    const items = await db.notificationLog.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit,
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}


