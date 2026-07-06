import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/public/services/{id}/items — vehicles / item options for a service
// Returns vehicles that either belong to this service OR are referenced by price-master rows for this service
// (e.g. Outstation reuses goods-transport vehicles via price-master)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const serviceId = Number(id);
  if (!serviceId) return NextResponse.json({ error: "Invalid service id" }, { status: 400 });

  const [service, ownVehicles, prices] = await Promise.all([
    db.service.findUnique({ where: { id: serviceId } }),
    db.vehicle.findMany({ where: { serviceId, status: "Active" }, orderBy: { sortOrder: "asc" } }),
    db.priceMaster.findMany({ where: { serviceId, status: "Active" }, include: { vehicle: true } }),
  ]);

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (service.status !== "Active") return NextResponse.json({ error: "Service not available" }, { status: 404 });

  // Merge own vehicles with vehicles referenced by price-master (dedup by id)
  const vehicleMap = new Map<number, any>();
  for (const v of ownVehicles) vehicleMap.set(v.id, v);
  for (const p of prices) {
    if (p.vehicle && !vehicleMap.has(p.vehicle.id)) {
      vehicleMap.set(p.vehicle.id, p.vehicle);
    }
  }
  const vehicles = Array.from(vehicleMap.values());

  return NextResponse.json({ service, vehicles, prices });
}
