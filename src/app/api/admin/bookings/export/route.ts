import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/bookings/export?format=csv|xlsx — export bookings
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "csv";
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to + "T23:59:59");
  }

  const bookings = await db.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { service: true, vehicle: true, customer: true },
  });

  const rows = bookings.map((b) => ({
    OrderID: b.bookingId,
    Date: new Date(b.createdAt).toLocaleString("en-IN"),
    Customer: b.customer?.name || "",
    Mobile: b.customer?.mobile || "",
    Service: b.service?.name || "",
    Vehicle: b.vehicle?.name || "",
    Pickup: (b.pickupAddress || "").replace(/[\n\r,]/g, " "),
    Drop: (b.dropAddress || "").replace(/[\n\r,]/g, " "),
    KM: b.distanceKm || "",
    Estimate: b.finalEstimate,
    Discount: b.discountApplied,
    FinalAmount: b.adminFinalAmount ?? b.finalEstimate,
    Payment: b.paymentOption || "",
    PaymentStatus: b.paymentStatus,
    Status: b.status,
    Driver: b.driverName || "",
    DriverMobile: b.driverMobile || "",
  }));

  const headers = ["OrderID","Date","Customer","Mobile","Service","Vehicle","Pickup","Drop","KM","Estimate","Discount","FinalAmount","Payment","PaymentStatus","Status","Driver","DriverMobile"];

  if (format === "csv") {
    const esc = (v: any) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="parcelmaadi-bookings-${Date.now()}.csv"`,
      },
    });
  }

  // XLSX (Excel) — minimal XML SpreadsheetML format that Excel opens natively
  if (format === "xlsx") {
    const xmlHeader = '<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n';
    const sheet = `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Bookings"><Table>
<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("")}</Row>
${rows.map((r) => `<Row>${headers.map((h) => {
      const v = (r as any)[h];
      const isNum = typeof v === "number";
      return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</Data></Cell>`;
    }).join("")}</Row>`).join("\n")}
</Table></Worksheet></Workbook>`;
    return new NextResponse(xmlHeader + sheet, {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="parcelmaadi-bookings-${Date.now()}.xls"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
