import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // 10-digit Indian mobile

// POST /api/waitlist — public, no auth. Body: { contact, sourcePage }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = String(body?.contact || "").trim();
    const sourcePage = body?.sourcePage ? String(body.sourcePage).slice(0, 200) : null;

    if (!raw) {
      return NextResponse.json({ error: "Please enter your email or phone number" }, { status: 400 });
    }

    let contactType: "email" | "phone";
    let contact = raw;

    if (EMAIL_RE.test(raw)) {
      contactType = "email";
      contact = raw.toLowerCase();
    } else if (PHONE_RE.test(raw.replace(/\D/g, "").slice(-10))) {
      contactType = "phone";
      contact = raw.replace(/\D/g, "").slice(-10);
    } else {
      return NextResponse.json({ error: "Enter a valid email or 10-digit Indian phone number" }, { status: 400 });
    }

    const existing = await db.waitlist.findUnique({ where: { contact } });
    if (existing) {
      return NextResponse.json({ ok: true, message: "You're already on the list! We'll notify you the moment the app is live." });
    }

    await db.waitlist.create({ data: { contact, contactType, sourcePage } });

    return NextResponse.json({ ok: true, message: "Thanks! We'll notify you the moment the app is live." });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
