import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/security — security overview.
// Surfaces: admin users, recent failed password resets, API keys, active integrations,
// feature flags (especially security-related). All from existing models.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const [admins, apiKeys, integrations, recentResets, recentAudit, flags] = await Promise.all([
      db.adminUser.findMany({
        select: {
          id: true, name: true, email: true, role: true, status: true,
          forcePasswordChange: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      db.apiKey.findMany({
        select: { id: true, name: true, keyPrefix: true, scopes: true, lastUsedAt: true, expiresAt: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
      db.integration.findMany({
        select: { id: true, name: true, category: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
      db.passwordReset.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { admin: { select: { email: true, name: true } } },
      }),
      db.auditLog.findMany({
        where: {
          OR: [
            { action: { contains: "login" } },
            { action: { contains: "Login" } },
            { action: { contains: "password" } },
            { action: { contains: "Password" } },
            { module: { contains: "auth" } },
            { module: { contains: "Auth" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.featureFlag.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      summary: {
        admins: admins.length,
        activeAdmins: admins.filter((a) => a.status === "Active").length,
        apiKeys: apiKeys.length,
        activeApiKeys: apiKeys.filter((k) => k.status === "Active").length,
        integrations: integrations.length,
        activeIntegrations: integrations.filter((i) => i.status === "Active").length,
        pendingResets: recentResets.filter((r) => !r.used && r.expiresAt > new Date()).length,
      },
      admins,
      apiKeys,
      integrations,
      recentResets,
      recentAudit,
      flags,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Security fetch failed" }, { status: 500 });
  }
}
