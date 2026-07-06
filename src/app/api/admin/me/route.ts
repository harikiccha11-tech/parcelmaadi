import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({
    admin: { id: auth.admin.id, name: auth.admin.name, email: auth.admin.email, role: auth.admin.role },
  });
}
