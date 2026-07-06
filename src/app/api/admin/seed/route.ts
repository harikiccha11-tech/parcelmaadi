import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { execSync } from "child_process";

// POST /api/admin/seed — re-run seed (re-sync default data). For dev convenience.
export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    execSync("bun run scripts/seed.ts", { cwd: process.cwd() });
    return NextResponse.json({ ok: true, message: "Seed completed" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Seed failed" }, { status: 500 });
  }
}
