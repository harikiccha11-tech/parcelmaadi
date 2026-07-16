import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/ai/demand — 7-day demand forecast.
// Uses a simple moving average of last 14 days of bookings, weighted by
// day-of-week patterns (Mon-Sun). Returns one forecast per day.
// No external AI calls.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const daily = await db.$queryRaw`
      SELECT
        DATE(created_at) AS date,
        EXTRACT(DOW FROM created_at)::int AS dow,
        COUNT(*)::int AS bookings
      FROM "Booking"
      WHERE created_at >= NOW() - INTERVAL '28 days'
      GROUP BY DATE(created_at), dow
      ORDER BY DATE(created_at)
    ` as any[];

    // Average bookings per day-of-week (0=Sun, 6=Sat)
    const dowAvg: number[] = new Array(7).fill(0);
    const dowCount: number[] = new Array(7).fill(0);
    for (const row of daily) {
      const d = Number(row.dow);
      dowAvg[d] += Number(row.bookings);
      dowCount[d] += 1;
    }
    for (let i = 0; i < 7; i++) {
      dowAvg[i] = dowCount[i] > 0 ? dowAvg[i] / dowCount[i] : 0;
    }

    // 7-day forecast
    const forecast: { date: string; dow: number; predicted: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      forecast.push({
        date: d.toISOString().slice(0, 10),
        dow,
        predicted: Math.round(dowAvg[dow]),
      });
    }

    return NextResponse.json({
      ok: true,
      forecast,
      dowAvg: dowAvg.map((v) => Math.round(v * 10) / 10),
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "AI demand failed" }, { status: 500 });
  }
}
