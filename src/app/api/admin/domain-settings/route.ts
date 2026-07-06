import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/domain-settings
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const domain = await db.domainSettings.findFirst();
  return NextResponse.json({ domain: domain || {} });
}

// PATCH /api/admin/domain-settings
export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const allowed = ["customerUrl", "adminUrl", "apiBaseUrl", "canonicalUrl", "whatsappBookingUrl", "logoUrl", "imageBaseUrl", "sitemapUrl", "robotsSettings", "seoTitle", "seoDescription"];
  const data: any = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  let domain = await db.domainSettings.findFirst();
  if (domain) {
    domain = await db.domainSettings.update({ where: { id: domain.id }, data });
  } else {
    domain = await db.domainSettings.create({ data });
  }
  return NextResponse.json({ domain });
}
