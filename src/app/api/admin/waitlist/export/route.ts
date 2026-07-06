import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/waitlist/export — download CSV of all waitlist signups
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const entries = await db.waitlist.findMany({ orderBy: { createdAt: "desc" } });

  const header = ["ID", "Contact", "Type", "Source Page", "Signed Up At"];
  const rows = entries.map((e) => [
    e.id,
    e.contact,
    e.contactType,
    e.sourcePage || "",
    e.createdAt.toISOString(),
  ]);

  const escape = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="parcelmaadi-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
