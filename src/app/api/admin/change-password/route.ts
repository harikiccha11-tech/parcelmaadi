import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";

// POST /api/admin/change-password — change own password; clears forcePasswordChange
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { currentPassword, newPassword } = await req.json();
  if (!newPassword || String(newPassword).length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

  // verify current password
  const admin = await db.adminUser.findUnique({ where: { id: auth.admin.id } });
  if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  const { verifyPassword } = await import("@/lib/password");
  if (admin.forcePasswordChange) {
    // first-time setup: currentPassword is the temp password
    if (!verifyPassword(currentPassword || "", admin.passwordHash)) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
  } else {
    if (!verifyPassword(currentPassword || "", admin.passwordHash)) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });
  }

  await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(newPassword), forcePasswordChange: false } });
  await db.adminActivity.create({ data: { adminId: admin.id, action: "password_changed", detail: "Self password change", ip: getClientIp(req) } });
  return NextResponse.json({ ok: true, message: "Password changed successfully" });
}
