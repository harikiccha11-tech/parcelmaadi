// Helper: resolve zone by pincode or city name
import { db } from "@/lib/db";

export async function resolveZone(opts: { pincode?: string; city?: string; lat?: number; lng?: number }): Promise<number | null> {
  // 1. Try pincode match
  if (opts.pincode) {
    const zones = await db.zone.findMany({ where: { status: "Active" } });
    for (const z of zones) {
      if (!z.pinCodes) continue;
      const pins = z.pinCodes.split(",").map((p) => p.trim());
      if (pins.includes(opts.pincode)) return z.id;
    }
  }

  // 2. Try city match (case-insensitive)
  if (opts.city) {
    const city = opts.city.toLowerCase().trim();
    const zones = await db.zone.findMany({ where: { status: "Active" } });
    for (const z of zones) {
      if (!z.cities) continue;
      const cities = z.cities.split(",").map((c) => c.toLowerCase().trim());
      if (cities.some((c) => c.includes(city) || city.includes(c))) return z.id;
    }
  }

  // 3. Fallback: return null (means "no zone restriction" → show everything)
  return null;
}

// Helper: filter items by zone availability
// If zoneId is null, return all items (no restriction)
// If zoneId is set, return only items that are available in that zone
export async function filterByZone<T extends { id: number }>(
  items: T[],
  zoneId: number | null,
  itemType: string
): Promise<T[]> {
  if (zoneId === null) return items; // no zone restriction

  const rules = await db.zoneAvailability.findMany({
    where: { zoneId, itemType },
  });
  const ruleMap = new Map(rules.map((r) => [r.itemId, r.available]));

  // Items are available if:
  // - There's an explicit rule with available=true, OR
  // - There's no rule at all (default = available)
  return items.filter((item) => ruleMap.get(item.id) ?? true);
}
