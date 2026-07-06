import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/waitlist — list all signups, newest first
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const entries = await db.waitlist.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ entries, total: entries.length });
}
