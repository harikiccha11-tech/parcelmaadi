import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const apks = await db.apk.findMany({
    where: { status: "Active" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true, slug: true, description: true, iconUrl: true, downloadUrl: true, version: true, fileSize: true, developer: true, category: true, maintenanceMode: true, maintenanceMsg: true, paymentType: true, upiId: true, upiPayeeName: true, paymentAmount: true, paymentCycle: true, paymentNotes: true, qrUrl: true, comingSoon: true, comingSoonText: true },
  });
  return NextResponse.json({ apks });
}
