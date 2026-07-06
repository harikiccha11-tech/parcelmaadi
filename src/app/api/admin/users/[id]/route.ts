import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";

// PATCH /api/admin/users/{id} — update admin user (role/status/name/mobile; password if provided)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role !== "Owner") return NextResponse.json({ error: "Only Owner can manage admin users" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const { name, email, mobile, role, status, password } = body || {};
  const data: any = {};
  if (name != null) data.name = name;
  if (email != null) data.email = String(email).toLowerCase().trim();
  if (mobile != null) data.mobile = mobile;
  if (role != null) {
    const validRoles = ["Owner", "Operations", "Accounts", "View"];
    if (!validRoles.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    data.role = role;
  }
  if (status != null) data.status = status;
  if (password) data.passwordHash = hashPassword(password);
  const user = await db.adminUser.update({
    where: { id: Number(id) },
    data,
    select: { id: true, name: true, email: true, mobile: true, role: true, status: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role !== "Owner") return NextResponse.json({ error: "Only Owner can manage admin users" }, { status: 403 });
  const { id } = await params;
  if (Number(id) === auth.admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  await db.adminUser.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
