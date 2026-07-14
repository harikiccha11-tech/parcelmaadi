import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/visitor/track — save visitor info (called from customer site)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      ip, city, region, country, timezone,
      device, page, referrer, localTime, sessionId,
    } = body || {};

    // Get real IP from headers (Vercel proxy)
    const headers = new Headers(req.headers);
    const realIp = ip || headers.get("x-forwarded-for")?.split(",")[0] || headers.get("x-real-ip") || "unknown";
    const userAgent = headers.get("user-agent") || "unknown";

    // Save to database
    const visitor = await db.visitor.create({
      data: {
        ip: realIp,
        city: city || null,
        region: region || null,
        country: country || null,
        timezone: timezone || null,
        device: device || null,
        page: page || null,
        referrer: referrer || null,
        localTime: localTime || null,
        sessionId: sessionId || null,
        userAgent,
      },
    });

    return NextResponse.json({ status: "success", id: visitor.id });
  } catch (e: any) {
    // Silent fail — don't break customer site
    return NextResponse.json({ status: "error", message: e?.message }, { status: 500 });
  }
}
