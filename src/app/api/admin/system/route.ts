import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/system — system info, feature flags, integration health.
// POST /api/admin/system — toggle a feature flag { action: "flag", key, isEnabled }.

let cache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 30 * 1000;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true });
  }

  try {
    const [flags, integrations, settings] = await Promise.all([
      db.featureFlag.findMany({ orderBy: { key: "asc" } }),
      db.integration.findMany({ orderBy: { name: "asc" } }),
      db.settings.findMany({ where: { OR: [{ key: { startsWith: "session_" } }, { key: { startsWith: "system_" } }] } }),
    ]);

    const data = {
      ok: true,
      flags,
      integrations,
      settings,
      info: {
        version: "1.1.0",
        nodeEnv: process.env.NODE_ENV || "development",
        vercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION || "local",
        time: new Date().toISOString(),
      },
    };
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "System fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });

  try {
    const body = await req.json();
    const { action, key, isEnabled } = body || {};

    if (action === "flag") {
      if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
      const updated = await db.featureFlag.upsert({
        where: { key },
        update: { enabled: !!isEnabled },
        create: { key, enabled: !!isEnabled },
      });
      cache = null;
      try {
        await db.auditLog.create({
          data: {
            adminId: auth.admin.id,
            adminEmail: auth.admin.email,
            action: `flag:${key}:${isEnabled ? "on" : "off"}`,
            module: "system",
            entityType: "FeatureFlag",
            entityId: updated.id,
            after: JSON.stringify({ enabled: updated.enabled }),
          },
        });
      } catch {}
      return NextResponse.json({ ok: true, flag: updated });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "System update failed" }, { status: 500 });
  }
}
