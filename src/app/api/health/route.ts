import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/health — public health probe.
// Used by uptime monitors (UptimeRobot, BetterStack, Vercel cron).
// Returns 200 even when DB is down — degraded state still answers.
export async function GET() {
  let dbState: "ok" | "degraded" = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbState = "degraded";
  }
  return NextResponse.json({
    ok: true,
    status: dbState,
    service: "parcelmaadi",
    version: "1.1.0",
    time: new Date().toISOString(),
  });
}
