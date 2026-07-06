import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getSettingsMap } from "@/lib/config";

// POST /api/admin/password-reset/request
// Flow: enter registered email → secure one-time reset token created → link returned (dev) / emailed (prod)
// NEVER reveals whether the email exists. Generic message always.
// Rate limited: max 3 requests/hour per IP + per email.
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const settings = await getSettingsMap();
  const limitPerHour = Number(settings.password_reset_rate_limit_per_hour || 3);

  // Rate limit per IP
  const rlIp = rateLimit(`pwreset-ip:${ip}`, limitPerHour * 2);
  if (!rlIp.ok) {
    return NextResponse.json({ error: `Too many reset attempts. Retry in ${rlIp.retryAfterSec}s.`, generic: true }, { status: 429 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ message: "If this account exists, a reset link has been sent." });

  const admin = await db.adminUser.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!admin) {
    // Do NOT reveal that the email doesn't exist. Return the same generic message.
    return NextResponse.json({ message: "If this account exists, a reset link has been sent." });
  }

  // Rate limit per admin (max 3/hour)
  const rlAdmin = rateLimit(`pwreset-admin:${admin.id}`, limitPerHour);
  if (!rlAdmin.ok) {
    return NextResponse.json({ message: "If this account exists, a reset link has been sent." });
  }

  // Invalidate all previous unused tokens for this admin (single active token)
  await db.passwordReset.updateMany({ where: { adminId: admin.id, used: false }, data: { used: true } });

  // Create a new token (crypto-random, 32 bytes hex)
  const token = crypto.randomBytes(32).toString("hex");
  const expiryMin = Number(settings.password_reset_link_expiry_minutes || 20);
  const expiresAt = new Date(Date.now() + expiryMin * 60 * 1000);
  await db.passwordReset.create({ data: { adminId: admin.id, token, expiresAt } });

  // Build the reset link (relative path; works on any domain)
  const resetLink = `/admin/reset?token=${token}`;

  // Check if an email provider is configured (RESEND_API_KEY env var)
  if (process.env.RESEND_API_KEY) {
    try {
      const recoveryEmail = settings.password_recovery_email || admin.email;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ParcelMaadi <noreply@parcelmaadi.com>",
          to: recoveryEmail,
          subject: "ParcelMaadi Admin — Password Reset",
          html: `<p>A password reset was requested for your ParcelMaadi admin account.</p><p>Click <a href="${resetLink}">here</a> to reset your password.</p><p>This link expires in ${expiryMin} minutes.</p><p>If you did not request this, ignore this email.</p>`,
        }),
      });
      return NextResponse.json({ message: "If this account exists, a reset link has been sent to the registered email." });
    } catch (e: any) {
      console.error("Password reset email send failed:", e?.message);
      // Fall through to dev mode below
    }
  }

  // Email not configured (no RESEND_API_KEY) — return the reset link directly (dev mode).
  // This is intentional for development/preview without an email provider.
  console.warn("WARNING: Email sending is not configured (RESEND_API_KEY not set). Password reset link returned in API response instead of being emailed. Set RESEND_API_KEY for production email delivery.");
  return NextResponse.json({ message: "If this account exists, a reset link has been sent.", resetLink, dev: true });
}
