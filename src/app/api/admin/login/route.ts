import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { getSettingsMap } from "@/lib/config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/admin/login — rate-limited, session timeout from settings
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const settings = await getSettingsMap();
    const limit = Number(settings.rate_limit_login_per_minute || 5);
    const rl = rateLimit(`login:${ip}`, Number.isFinite(limit) ? limit : 5);
    if (!rl.ok) {
      return NextResponse.json({ error: `Too many login attempts. Retry in ${rl.retryAfterSec}s.` }, { status: 429 });
    }
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const admin = await db.adminUser.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!admin || admin.status !== "Active") {
      await db.adminActivity.create({ data: { adminId: admin?.id || null, action: "login_failed", detail: `Email: ${email}`, ip } });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (!verifyPassword(password, admin.passwordHash)) {
      await db.adminActivity.create({ data: { adminId: admin.id, action: "login_failed", detail: "Wrong password", ip } });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const timeoutMin = Number(settings.session_timeout_minutes || 60);
    await createSession(admin.id, Number.isFinite(timeoutMin) ? timeoutMin : 60);
    await db.adminActivity.create({ data: { adminId: admin.id, action: "login_success", detail: `Role: ${admin.role}`, ip } });
    return NextResponse.json({
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, forcePasswordChange: admin.forcePasswordChange },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Login failed" }, { status: 500 });
  }
}
