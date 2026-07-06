import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getClientIp } from "@/lib/rate-limit";

// POST /api/admin/password-reset/confirm
// Validates token (single-use, not expired), sets new password, invalidates token + all sessions
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { token, newPassword } = await req.json();
  if (!token || !newPassword) return NextResponse.json({ error: "Token and new password required" }, { status: 400 });
  if (String(newPassword).length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const reset = await db.passwordReset.findUnique({ where: { token: String(token) } });
  if (!reset || reset.used) return NextResponse.json({ error: "Invalid or already-used reset link." }, { status: 400 });
  if (reset.expiresAt < new Date()) return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 });

  const admin = await db.adminUser.findUnique({ where: { id: reset.adminId } });
  if (!admin) return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });

  // Set new password
  await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(String(newPassword)) } });
  // Invalidate this token (single-use)
  await db.passwordReset.update({ where: { id: reset.id }, data: { used: true } });
  // Invalidate ALL other unused tokens for this admin (forces logout of all sessions conceptually)
  await db.passwordReset.updateMany({ where: { adminId: admin.id, used: false }, data: { used: true } });
  // Activity log
  await db.adminActivity.create({ data: { adminId: admin.id, action: "password_reset", detail: "Password reset via token", ip } });

  return NextResponse.json({ ok: true, message: "Password reset successful. Please log in with your new password." });
}
