import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bookingId");
    if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

    const booking = await db.booking.findFirst({
      where: { bookingId },
      include: { service: true, customer: true, vehicle: true },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const settings = await db.settings.findMany();
    const s: Record<string, string> = {};
    for (const set of settings) { if (set.value) s[set.key] = set.value; }

    const amount = booking.adminFinalAmount || booking.finalEstimate;
    const gst = 5;
    const base = amount / (1 + gst / 100);
    const cgst = base * (gst / 200);
    const sgst = base * (gst / 200);
    const invNo = `PM-INV-${booking.id.toString().padStart(5, "0")}`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invNo}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a1a}
.header{text-align:center;border-bottom:3px solid #FFD700;padding-bottom:15px;margin-bottom:20px}
.header h1{color:#E31E24;margin:0;font-size:28px}
table{width:100%;border-collapse:collapse;margin:15px 0}
th{background:#1a1a1a;color:#FFD700;padding:10px;text-align:left;font-size:12px}
td{padding:10px;border-bottom:1px solid #ddd;font-size:12px}
.totals{margin-left:auto;width:300px}
.totals .row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;border-bottom:1px dotted #ddd}
.totals .total{font-weight:bold;font-size:16px;border-top:2px solid #1a1a1a;padding-top:8px;margin-top:5px}
.footer{margin-top:30px;text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:10px}
@media print{body{padding:0}}</style></head><body>
<div class="header"><h1>${s.company_name || "HP ENTERPRISE"}</h1>
<div style="color:#666;font-size:12px">${s.company_address || "Nagenahalli, Hosadurga, Karnataka 577515"}<br>
GSTIN: ${s.gstin || "29ANZPH4067Q1ZS"} | ${s.email || "parcelmaadipm@gmail.com"} | ${s.contact_1 || "9741433725"}</div></div>
<h2 style="text-align:center">TAX INVOICE</h2>
<div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px">
<div><strong>Invoice No:</strong> ${invNo}<br><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</div>
<div><strong>Booking:</strong> ${booking.bookingId}<br><strong>Payment:</strong> ${booking.paymentStatus}</div></div>
<div style="margin-bottom:15px"><strong>Bill To:</strong><br>${booking.customer?.name || "Customer"}<br>${booking.customer?.mobile || ""}<br>${booking.pickupAddress || ""}</div>
<table><thead><tr><th>Description</th><th>HSN</th><th>Qty</th><th>Amount</th></tr></thead>
<tbody><tr><td>${booking.service?.name || "Logistics"} - ${booking.distanceKm || 0}km</td><td>9965</td><td>1</td><td>&#8377;${base.toFixed(2)}</td></tr></tbody></table>
<div class="totals"><div class="row"><span>Subtotal:</span><span>&#8377;${base.toFixed(2)}</span></div>
<div class="row"><span>CGST @ 2.5%:</span><span>&#8377;${cgst.toFixed(2)}</span></div>
<div class="row"><span>SGST @ 2.5%:</span><span>&#8377;${sgst.toFixed(2)}</span></div>
<div class="row total"><span>Total:</span><span>&#8377;${(base+cgst+sgst).toFixed(2)}</span></div></div>
<div class="footer">Computer-generated invoice. Thank you for choosing ${s.brand_name || "ParcelMaadi"}!</div>
</body></html>`;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
