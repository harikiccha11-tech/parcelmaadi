import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/settings — live settings, contact, logo, colors, UPI and domain links
export async function GET() {
  const [settings, domain, contentSections] = await Promise.all([
    db.settings.findMany(),
    db.domainSettings.findFirst(),
    db.contentSection.findMany({ where: { status: "Active" }, orderBy: { sortOrder: "asc" } }),
  ]);

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    if (s.value != null) settingsMap[s.key] = s.value;
  }

  const content: Record<string, { title: string | null; subtitle: string | null; body: string | null; imageUrl: string | null }> = {};
  for (const c of contentSections) {
    content[c.sectionKey] = { title: c.title, subtitle: c.subtitle, body: c.body, imageUrl: c.imageUrl };
  }

  return NextResponse.json({ settings: settingsMap, domain: domain || {}, content });
}
