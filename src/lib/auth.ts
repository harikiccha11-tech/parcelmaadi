// Lightweight admin session auth using signed httpOnly cookie
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export { hashPassword, verifyPassword };

// In production, SESSION_SECRET MUST be set via environment variable.
// In dev, we use a default so local setup doesn't require configuration.
// Note: during `next build` (static analysis), we skip the check to avoid
// build failures — the runtime check happens when the server starts.
const SESSION_SECRET = (() => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // During build phase, use a placeholder (never used at runtime)
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-not-used-at-runtime";
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL: SESSION_SECRET environment variable is not set. " +
      "Set it to a random 32+ character string (e.g. `openssl rand -base64 32`). " +
      "The app refuses to start in production without a secure session secret."
    );
  }
  console.warn("WARNING: Using default SESSION_SECRET for local dev. Set SESSION_SECRET env var for production.");
  return "parcelmaadi-dev-secret-do-not-use-in-production";
})();
const COOKIE_NAME = "pm_admin_session";
// Session timeout — default 60 min (admin-configurable via settings.session_timeout_minutes)
const DEFAULT_SESSION_TIMEOUT_MIN = 60;

function sign(payload: string): string {
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verify(token: string): { id: string; exp: number } | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (Date.now() > decoded.exp) return null;
    return { id: String(decoded.id), exp: decoded.exp };
  } catch {
    return null;
  }
}

export async function createSession(adminId: number, timeoutMinutes?: number) {
  const min = timeoutMinutes || DEFAULT_SESSION_TIMEOUT_MIN;
  const ttlMs = min * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ id: adminId, exp: Date.now() + ttlMs, iat: Date.now() })
  ).toString("base64");
  const token = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ttlMs / 1000,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const v = verify(token);
  return v?.id || null;
}

// Sliding-session: refresh expiry on each admin request so active admins don't get logged out
export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return { ok: false as const, error: "Unauthorized", status: 401 };
  }
  const v = verify(token);
  if (!v) {
    return { ok: false as const, error: "Session expired. Please log in again.", status: 401 };
  }
  const admin = await db.adminUser.findUnique({ where: { id: Number(v.id) } });
  if (!admin || admin.status !== "Active") {
    return { ok: false as const, error: "Unauthorized", status: 401 };
  }
  // Read configured timeout from settings, refresh the cookie (sliding window)
  try {
    const s = await db.settings.findUnique({ where: { key: "session_timeout_minutes" } });
    const min = s?.value ? Number(s.value) : DEFAULT_SESSION_TIMEOUT_MIN;
    if (Number.isFinite(min) && min > 0) {
      await createSession(admin.id, min);
    }
  } catch {}
  return { ok: true as const, admin };
}

// Role-based access helper
export type AdminRole = "Owner" | "Operations" | "Accounts" | "View";
const ROLE_PERMS: Record<string, string[]> = {
  Owner: ["*"],
  Operations: ["dashboard", "bookings", "price", "services", "suppliers", "products", "settings", "domain"],
  Accounts: ["dashboard", "bookings", "settings", "domain"],
  View: ["dashboard", "bookings"],
};
export function roleCan(role: string, area: string): boolean {
  const perms = ROLE_PERMS[role] || [];
  return perms.includes("*") || perms.includes(area);
}
