import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import PDFDocument from "pdfkit";

// GET /api/payments/invoice?bookingId=PM-20260706-9506 — generate GST invoice PDF
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const booking = await db.booking.findFirst({
      where: { bookingId },
      include: { service: true, customer: true, vehicle: true, supplier: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Business details from settings
    const settings = await db.settings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      if (s.value) settingsMap[s.key] = s.value;
    }

    const companyName = settingsMap.company_name || "HP ENTERPRISE";
    const brandName = settingsMap.brand_name || "ParcelMaadi";
    const gstin = settingsMap.gstin || "29ANZPH4067Q1ZS";
    const email = settingsMap.email || "parcelmaadipm@gmail.com";
    const phone = settingsMap.contact_1 || "9741433725";
    const address = settingsMap.company_address || "HP Enterprise, Venkateshwara Nilaya, behind Hanuman Mandir, Nagenahalli, Hosadurga, Chitradurga, Karnataka 577515";

    const amount = booking.adminFinalAmount || booking.finalEstimate;
    const gstPercent = 5; // Default GST for logistics
    const cgstRate = gstPercent / 2;
    const sgstRate = gstPercent / 2;
    const baseAmount = amount / (1 + gstPercent / 100);
    const cgst = baseAmount * (cgstRate / 100);
    const sgst = baseAmount * (sgstRate / 100);
    const total = baseAmount + cgst + sgst;

    // Generate invoice number
    const invoiceNo = `PM-INV-${booking.id.toString().padStart(5, "0")}`;
    const invoiceDate = new Date().toLocaleDateString("en-IN");

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(22).font("Helvetica-Bold").text(companyName, { align: "center" });
    doc.fontSize(10).font("Helvetica").text(`(Brand: ${brandName})`, { align: "center" });
    doc.fontSize(9).text(address, { align: "center" });
    doc.text(`GSTIN: ${gstin} | Email: ${email} | Phone: ${phone}`, { align: "center" });
    doc.moveDown();

    // Invoice title
    doc.fontSize(16).font("Helvetica-Bold").text("TAX INVOICE", { align: "center" });
    doc.moveDown(0.5);

    // Invoice details
    doc.fontSize(10).font("Helvetica");
    doc.text(`Invoice No: ${invoiceNo}`, 50);
    doc.text(`Invoice Date: ${invoiceDate}`, 50);
    doc.text(`Booking ID: ${booking.bookingId}`, 50);
    doc.moveDown();

    // Bill To
    doc.font("Helvetica-Bold").text("Bill To:", 50);
    doc.font("Helvetica").text(booking.customer?.name || "Customer", 50);
    doc.text(booking.customer?.mobile || "", 50);
    doc.text(booking.pickupAddress || "", 50);
    doc.moveDown();

    // Service details
    doc.font("Helvetica-Bold").text("Service Details:", 50);
    doc.font("Helvetica").text(`Service: ${booking.service?.name || "N/A"}`, 50);
    doc.text(`Vehicle: ${booking.vehicle?.name || "N/A"}`, 50);
    doc.text(`From: ${booking.pickupAddress || "N/A"}`, 50);
    doc.text(`To: ${booking.dropAddress || "N/A"}`, 50);
    doc.text(`Distance: ${booking.distanceKm || 0} km`, 50);
    doc.moveDown();

    // Table header
    const tableTop = doc.y + 10;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Description", 50, tableTop);
    doc.text("HSN", 250, tableTop);
    doc.text("Qty", 320, tableTop);
    doc.text("Rate", 370, tableTop);
    doc.text("Amount", 450, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table row
    doc.font("Helvetica").fontSize(10);
    const rowY = tableTop + 25;
    doc.text(`${booking.service?.name || "Logistics Service"} - ${booking.distanceKm || 0} km`, 50, rowY);
    doc.text("9965", 250, rowY); // HSN for transport
    doc.text("1", 320, rowY);
    doc.text(`₹${baseAmount.toFixed(2)}`, 370, rowY);
    doc.text(`₹${baseAmount.toFixed(2)}`, 450, rowY);
    doc.moveTo(50, rowY + 20).lineTo(550, rowY + 20).stroke();

    // Totals
    const totalsY = rowY + 35;
    doc.font("Helvetica").text("Subtotal:", 350, totalsY);
    doc.text(`₹${baseAmount.toFixed(2)}`, 450, totalsY);
    doc.text(`CGST @ ${cgstRate}%:`, 350, totalsY + 15);
    doc.text(`₹${cgst.toFixed(2)}`, 450, totalsY + 15);
    doc.text(`SGST @ ${sgstRate}%:`, 350, totalsY + 30);
    doc.text(`₹${sgst.toFixed(2)}`, 450, totalsY + 30);
    doc.font("Helvetica-Bold").text("Total:", 350, totalsY + 50);
    doc.text(`₹${total.toFixed(2)}`, 450, totalsY + 50);
    doc.moveTo(350, totalsY + 65).lineTo(550, totalsY + 65).stroke();

    // Amount in words
    doc.moveDown(3);
    doc.font("Helvetica").fontSize(9);
    doc.text(`Amount in words: Rupees ${numberToWords(Math.round(total))} only`, 50);
    doc.text(`Payment Status: ${booking.paymentStatus}`, 50);
    doc.text(`Payment Method: ${booking.paymentOption || "N/A"}`, 50);

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).font("Helvetica");
    doc.text("This is a computer-generated invoice and does not require a physical signature.", { align: "center" });
    doc.text(`Thank you for choosing ${brandName}!`, { align: "center" });

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.end();
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoiceNo}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error("Invoice generation error:", e);
    return NextResponse.json({ error: e?.message || "Invoice generation failed" }, { status: 500 });
  }
}

// Simple number to words for invoice
function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function twoDigit(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  
  function threeDigit(n: number): string {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + twoDigit(r);
  }
  
  let words = "";
  if (num >= 10000000) {
    words += twoDigit(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    words += twoDigit(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    words += twoDigit(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (num > 0) {
    words += threeDigit(num);
  }
  return words.trim();
}
