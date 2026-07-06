import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/settings — get all settings + content sections + seo
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const [settings, content, seo] = await Promise.all([
    db.settings.findMany(),
    db.contentSection.findMany({ orderBy: { sortOrder: "asc" } }),
    db.seoSetting.findMany(),
  ]);
  const map: Record<string, { value: string | null; type: string }> = {};
  for (const s of settings) map[s.key] = { value: s.value, type: s.type };
  return NextResponse.json({ settings: map, content, seo });
}

// PATCH /api/admin/settings — bulk update settings + content
export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const { settings, content } = body || {};
  if (settings && typeof settings === "object") {
    for (const [key, val] of Object.entries(settings)) {
      const value = typeof val === "object" ? (val as any).value : String(val);
      const existing = await db.settings.findUnique({ where: { key } });
      if (existing) {
        await db.settings.update({ where: { key }, data: { value: String(value ?? "") } });
      } else {
        await db.settings.create({ data: { key, value: String(value ?? ""), type: "text" } });
      }
    }
  }
  if (Array.isArray(content)) {
    for (const c of content) {
      const { sectionKey, title, subtitle, body: cbody, imageUrl, status, sortOrder } = c;
      const existing = await db.contentSection.findUnique({ where: { sectionKey } });
      if (existing) {
        await db.contentSection.update({ where: { sectionKey }, data: { title, subtitle, body: cbody, imageUrl, status, sortOrder: Number(sortOrder) || 0 } });
      } else {
        await db.contentSection.create({ data: { sectionKey, title, subtitle, body: cbody, imageUrl, status: status || "Active", sortOrder: Number(sortOrder) || 0 } });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
