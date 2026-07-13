import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/attendance — list attendance records
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const staffId = url.searchParams.get("staffId");
    const date = url.searchParams.get("date"); // YYYY-MM-DD
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const status = url.searchParams.get("status");
    const limit = Math.min(500, Number(url.searchParams.get("limit") || 200));

    const where: any = {};
    if (staffId) where.staffId = Number(staffId);
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    } else if (from && to) {
      where.date = { gte: new Date(from), lte: new Date(to) };
    }

    const items = await db.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      include: { staff: { select: { id: true, name: true, employeeId: true, designation: true, department: true } } },
    });

    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// POST /api/admin/attendance — mark attendance (present/absent/half-day/leave)
// Body: { staffId, date, status, checkIn?, checkOut?, notes? } OR { staffIds: [...], date, status } for bulk
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const markedBy = auth.admin.email;

    // Bulk mode: staffIds array
    if (Array.isArray(body.staffIds)) {
      const { staffIds, date, status, notes } = body;
      if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

      const d = new Date(date);
      const results: any[] = [];
      for (const sid of staffIds) {
        const item = await db.attendance.upsert({
          where: { staffId_date: { staffId: Number(sid), date: d } },
          create: {
            staffId: Number(sid),
            date: d,
            status: status || "Present",
            notes,
            markedBy,
          },
          update: {
            status: status || "Present",
            notes,
            markedBy,
          },
        });
        results.push(item);
      }
      return NextResponse.json({ ok: true, count: results.length, items: results });
    }

    // Single mode
    const { staffId, date, status, checkIn, checkOut, notes } = body;
    if (!staffId || !date) return NextResponse.json({ error: "staffId, date required" }, { status: 400 });

    const d = new Date(date);
    let workHours: number | undefined;
    if (checkIn && checkOut) {
      const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      workHours = Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
    }

    const item = await db.attendance.upsert({
      where: { staffId_date: { staffId: Number(staffId), date: d } },
      create: {
        staffId: Number(staffId),
        date: d,
        status: status || "Present",
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        workHours,
        notes,
        markedBy,
      },
      update: {
        status: status || "Present",
        checkIn: checkIn ? new Date(checkIn) : undefined,
        checkOut: checkOut ? new Date(checkOut) : undefined,
        workHours,
        notes,
        markedBy,
      },
      include: { staff: { select: { name: true, employeeId: true } } },
    });

    return NextResponse.json({ item, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Mark failed" }, { status: 500 });
  }
}
