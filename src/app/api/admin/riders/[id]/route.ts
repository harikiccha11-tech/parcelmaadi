import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/riders/{id}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["name","mobile","email","city","vehicleType","vehicleNumber","drivingLicense","aadhaar","address","zoneId","photoUrl","currentLat","currentLng","isOnline","isVerified","rating","status","archived"];
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }
    const item = await db.rider.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}

// DELETE /api/admin/riders/{id} — soft delete (archive) or hard delete
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const hard = url.searchParams.get("hard") === "true";

    // Try archive first (if model supports it)
    if (!hard) {
      try {
        const item = await db.rider.update({ where: { id: Number(id) }, data: { archived: true } });
        return NextResponse.json({ ok: true, archived: true, item });
      } catch {
        // fall through to hard delete
      }
    }
    await db.rider.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
