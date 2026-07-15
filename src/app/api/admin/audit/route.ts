import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/audit — recent audit & activity logs (v1.1 admin surface).
// ?take=50 (max 200) — most recent first.
// Mirrors the existing AuditLog model.
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const take = Math.min(Math.max(Number(url.searchParams.get("take")) || 50, 1), 200);
  const module = url.searchParams.get("module");

  try {
    const where = module ? { module } : {};
    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
      }),
      db.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      items,
      total,
      count: items.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Audit fetch failed" }, { status: 500 });
  }
}
