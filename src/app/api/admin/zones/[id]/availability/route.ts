import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/zones/{id}/availability — get all availability rules for this zone
// Returns: { services: [{...service, available}], vehicles: [...], products: [...] }
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const { id } = await params;
    const zoneId = Number(id);

    // Get all availability rules for this zone
    const rules = await db.zoneAvailability.findMany({ where: { zoneId } });
    const ruleMap = new Map(rules.map((r) => [`${r.itemType}:${r.itemId}`, r.available]));

    // Fetch all services, vehicles, products with availability flag
    const [services, vehicles, products] = await Promise.all([
      db.service.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, status: true, imageUrl: true } }),
      db.vehicle.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, serviceId: true, status: true, imageUrl: true } }),
      db.product.findMany({
        orderBy: { id: "asc" },
        take: 500, // cap for performance
        select: { id: true, productName: true, brand: true, category: true, supplierId: true, status: true, photoUrl: true, supplier: { select: { shopName: true } } },
      }),
    ]);

    // If no rule exists for an item, default to "available: true" (so existing items work)
    return NextResponse.json({
      zoneId,
      zoneName: (await db.zone.findUnique({ where: { id: zoneId }, select: { name: true } }))?.name || "Unknown",
      services: services.map((s) => ({ ...s, available: ruleMap.get(`Service:${s.id}`) ?? true })),
      vehicles: vehicles.map((v) => ({ ...v, available: ruleMap.get(`Vehicle:${v.id}`) ?? true })),
      products: products.map((p) => ({
        ...p,
        shopName: p.supplier?.shopName,
        available: ruleMap.get(`Product:${p.id}`) ?? true,
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch availability" }, { status: 500 });
  }
}

// PUT /api/admin/zones/{id}/availability — bulk update availability
// Body: { updates: [{ itemType, itemId, available }] }
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const zoneId = Number(id);
    const body = await req.json();
    const updates: Array<{ itemType: string; itemId: number; available: boolean }> = body.updates || [];

    // Use upsert for each update — keeps history clean
    const results = await Promise.all(
      updates.map((u) =>
        db.zoneAvailability.upsert({
          where: { zoneId_itemType_itemId: { zoneId, itemType: u.itemType, itemId: u.itemId } },
          create: { zoneId, itemType: u.itemType, itemId: u.itemId, available: u.available },
          update: { available: u.available },
        })
      )
    );

    return NextResponse.json({ ok: true, updated: results.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update availability" }, { status: 500 });
  }
}
