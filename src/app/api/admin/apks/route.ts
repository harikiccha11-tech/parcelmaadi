import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const apks = await db.apk.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ apks });
}

export async function POST(req: Request) {
  const { NextResponse } = await import("next/server");
  const { requireAdmin } = await import("@/lib/auth");
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role !== "Owner") return NextResponse.json({ error: "Only Owner can manage APKs" }, { status: 403 });
  const body = await req.json();
  const { name, slug, description, iconUrl, downloadUrl, version, fileSize, developer, category, status, maintenanceMode, maintenanceMsg, paymentType, upiId, upiPayeeName, paymentAmount, paymentCycle, paymentNotes, qrUrl, comingSoon, comingSoonText, sortOrder } = body || {};
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const finalSlug = slug || String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    const apk = await db.apk.create({ data: { name, slug: finalSlug, description: description || null, iconUrl: iconUrl || null, downloadUrl: downloadUrl || null, version: version || null, fileSize: fileSize || null, developer: developer || null, category: category || null, status: status || "Active", maintenanceMode: maintenanceMode || "Off", maintenanceMsg: maintenanceMsg || null, paymentType: paymentType || "Free", upiId: upiId || null, upiPayeeName: upiPayeeName || null, paymentAmount: Number(paymentAmount) || 0, paymentCycle: paymentCycle || null, paymentNotes: paymentNotes || null, qrUrl: qrUrl || null, comingSoon: comingSoon === true, comingSoonText: comingSoonText || null, sortOrder: Number(sortOrder) || 0 } });
    return NextResponse.json({ apk }, { status: 201 });
  } catch (e: any) {
    if (String(e?.code || "") === "P2002") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
