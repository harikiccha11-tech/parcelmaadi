import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";

// POST /api/admin/staff/{id}/reset-password — admin resets an employee's password
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const { newPassword } = body || {};

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const staff = await db.adminUser.findUnique({ where: { id: Number(id) } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

    await db.adminUser.update({
      where: { id: Number(id) },
      data: {
        passwordHash: hashPassword(newPassword),
        forcePasswordChange: true, // Force change on next login
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Password reset for ${staff.name || staff.email}. They will be asked to set a new password on next login.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Reset failed" }, { status: 500 });
  }
}
