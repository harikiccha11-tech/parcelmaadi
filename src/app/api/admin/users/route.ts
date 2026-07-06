import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, hashPassword } from "@/lib/auth";

// GET /api/admin/users — list all admin users (Owner only)
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role !== "Owner") return NextResponse.json({ error: "Only Owner can manage admin users" }, { status: 403 });
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, mobile: true, role: true, status: true, createdAt: true } });
  return NextResponse.json({ users });
}

// POST /api/admin/users — create new admin user
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role !== "Owner") return NextResponse.json({ error: "Only Owner can manage admin users" }, { status: 403 });
  const body = await req.json();
  const { name, email, mobile, role, password, status } = body || {};
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  const validRoles = ["Owner", "Operations", "Accounts", "View"];
  if (!validRoles.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const existing = await db.adminUser.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  const user = await db.adminUser.create({
    data: { name, email: String(email).toLowerCase().trim(), mobile, role, passwordHash: hashPassword(password), status: status || "Active" },
    select: { id: true, name: true, email: true, mobile: true, role: true, status: true, createdAt: true },
  });
  return NextResponse.json({ user });
}
