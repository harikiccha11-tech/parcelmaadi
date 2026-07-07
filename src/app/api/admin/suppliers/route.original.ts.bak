import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/suppliers
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const suppliers = await db.supplier.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { products: true } } } });
  return NextResponse.json({ suppliers });
}

// POST /api/admin/suppliers
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await req.json();
  const { supplierName, shopName, mobile, whatsapp, address, addressLat, addressLng, addressMapLink, flatDeliveryFee, mapLocation, supplierType, bankDetails, upiId, qrUrl, shopPhotoUrl, serviceArea, commissionPercent, status } = body || {};
  if (!supplierName) return NextResponse.json({ error: "supplierName required" }, { status: 400 });
  const supplier = await db.supplier.create({
    data: {
      supplierName, shopName, mobile, whatsapp, address,
      addressLat: addressLat ? Number(addressLat) : null,
      addressLng: addressLng ? Number(addressLng) : null,
      addressMapLink: addressMapLink || null,
      flatDeliveryFee: Number(flatDeliveryFee) || 0,
      mapLocation, supplierType,
      bankDetails, upiId, qrUrl, shopPhotoUrl, serviceArea,
      commissionPercent: Number(commissionPercent) || 0,
      status: status || "Pending",
    },
  });
  return NextResponse.json({ supplier });
}
