// Update all vehicle pricing with exact rates from HP Enterprise spec
// - 12 vehicles with capacity, base fare, per-km, waiting charges
// - Slab-based pricing (7 distance tiers)
// - Surge pricing (8 time slots)
// - 6 discount coupons
import { db } from "@/lib/db";

// Vehicle specs: capacity, base fare, per-km, free wait (min), wait/min charge
const VEHICLES = [
  { name: "2 Wheeler", maxLoad: "20 kg", baseFare: 48, perKm: 10, freeWait: 10, waitPerMin: 2 },
  { name: "Scooter", maxLoad: "20 kg", baseFare: 58, perKm: 12, freeWait: 10, waitPerMin: 2 },
  { name: "Mini 3W", maxLoad: "90 kg", baseFare: 146, perKm: 18, freeWait: 10, waitPerMin: 3 },
  { name: "E-Loader", maxLoad: "310 kg", baseFare: 244, perKm: 22, freeWait: 10, waitPerMin: 3 },
  { name: "3 Wheeler", maxLoad: "500 kg", baseFare: 313, perKm: 28, freeWait: 15, waitPerMin: 4 },
  { name: "Tata Ace", maxLoad: "1 ton", baseFare: 381, perKm: 35, freeWait: 15, waitPerMin: 5 },
  { name: "Pickup 8ft", maxLoad: "1.2 ton", baseFare: 479, perKm: 42, freeWait: 20, waitPerMin: 6 },
  { name: "Pickup 9ft", maxLoad: "1.7 ton", baseFare: 577, perKm: 48, freeWait: 20, waitPerMin: 6 },
  { name: "Tata 407", maxLoad: "2.5 ton", baseFare: 832, perKm: 55, freeWait: 20, waitPerMin: 7 },
  { name: "14ft", maxLoad: "3.5 ton", baseFare: 1665, perKm: 65, freeWait: 25, waitPerMin: 8 },
  { name: "17ft", maxLoad: "4.5 ton", baseFare: 2057, perKm: 75, freeWait: 25, waitPerMin: 9 },
  { name: "19ft", maxLoad: "6 ton", baseFare: 2939, perKm: 85, freeWait: 30, waitPerMin: 10 },
];

// Slab pricing: 7 distance tiers × 12 vehicles
// Format: "minKm-maxKm: price" — for 30+ use "30+:price"
const SLABS = {
  // Tier 1: 2 Wheeler, Scooter, Mini 3W, E-Loader
  "2 Wheeler":  ["0-2:48", "3-4:58", "5-7:77", "8-12:97", "13-19:126", "20-29:166", "30+:244"],
  "Scooter":    ["0-2:58", "3-4:68", "5-7:87", "8-12:117", "13-19:146", "20-29:185", "30+:274"],
  "Mini 3W":    ["0-2:146", "3-4:166", "5-7:205", "8-12:244", "13-19:293", "20-29:342", "30+:440"],
  "E-Loader":   ["0-2:244", "3-4:274", "5-7:313", "8-12:362", "13-19:420", "20-29:489", "30+:587"],
  // Tier 2: 3 Wheeler, Tata Ace, Pickup 8ft, Pickup 9ft
  "3 Wheeler":  ["0-2:313", "3-4:342", "5-7:391", "8-12:440", "13-19:489", "20-29:587", "30+:979"],
  "Tata Ace":   ["0-2:381", "3-4:411", "5-7:460", "8-12:509", "13-19:587", "20-29:685", "30+:1224"],
  "Pickup 8ft": ["0-2:479", "3-4:509", "5-7:558", "8-12:607", "13-19:685", "20-29:783", "30+:1371"],
  "Pickup 9ft": ["0-2:577", "3-4:607", "5-7:656", "8-12:705", "13-19:783", "20-29:881", "30+:1469"],
  // Tier 3: Tata 407, 14ft, 17ft, 19ft
  "Tata 407":   ["0-2:832", "3-4:881", "5-7:979", "8-12:1077", "13-19:1175", "20-29:1371", "30+:1959"],
  "14ft":       ["0-2:1665", "3-4:1763", "5-7:1861", "8-12:1959", "13-19:2155", "20-29:2449", "30+:3429"],
  "17ft":       ["0-2:2057", "3-4:2155", "5-7:2253", "8-12:2351", "13-19:2645", "20-29:2939", "30+:4115"],
  "19ft":       ["0-2:2939", "3-4:3037", "5-7:3135", "8-12:3233", "13-19:3625", "20-29:3919", "30+:5095"],
};

// Surge pricing time slots
const SURGE_SLOTS = [
  { time: "6:00 AM - 8:00 AM", multiplier: 1.0, label: "Normal" },
  { time: "8:00 AM - 10:00 AM", multiplier: 1.25, label: "Peak 1" },
  { time: "10:00 AM - 12:00 PM", multiplier: 1.1, label: "Medium" },
  { time: "12:00 PM - 4:00 PM", multiplier: 1.0, label: "Normal" },
  { time: "4:00 PM - 6:00 PM", multiplier: 1.3, label: "Peak 2" },
  { time: "6:00 PM - 8:00 PM", multiplier: 1.4, label: "Peak 3" },
  { time: "8:00 PM - 10:00 PM", multiplier: 1.2, label: "Medium" },
  { time: "10:00 PM - 6:00 AM", multiplier: 1.5, label: "Night" },
];

// Discount coupons
const COUPONS = [
  { code: "FIRST20", description: "20% OFF on first order", discountType: "percent", discountValue: 20, maxDiscount: 100, minOrderAmount: 0, usageLimit: 1000 },
  { code: "REFER50", description: "₹50 OFF on referral", discountType: "fixed", discountValue: 50, maxDiscount: 50, minOrderAmount: 100, usageLimit: 5000 },
  { code: "WEEKLY10", description: "₹10 OFF weekly offer", discountType: "fixed", discountValue: 10, maxDiscount: 10, minOrderAmount: 50, usageLimit: 10000 },
  { code: "FESTIVE15", description: "15% OFF festival offer", discountType: "percent", discountValue: 15, maxDiscount: 150, minOrderAmount: 200, usageLimit: 2000 },
  { code: "CORP10", description: "10% OFF corporate discount", discountType: "percent", discountValue: 10, maxDiscount: 250, minOrderAmount: 500, usageLimit: 1000 },
  { code: "BULK10", description: "10% OFF bulk order", discountType: "percent", discountValue: 10, maxDiscount: 200, minOrderAmount: 1000, usageLimit: 500 },
];

async function main() {
  console.log("=== Updating vehicle pricing ===\n");

  // 1. Update vehicles with capacity + base fare + per-km + waiting
  const parcelService = await db.service.findUnique({ where: { slug: "parcel-delivery" } }).catch(() => null);
  const goodsService = await db.service.findUnique({ where: { slug: "goods-transport" } }).catch(() => null);

  for (const v of VEHICLES) {
    // Find existing vehicle by name (across all services)
    const existing = await db.vehicle.findFirst({ where: { name: v.name } }).catch(() => null);
    if (existing) {
      await db.vehicle.update({
        where: { id: existing.id },
        data: {
          maxLoad: v.maxLoad,
        },
      });
      console.log(`  ✅ Updated vehicle: ${v.name} (${v.maxLoad})`);
    } else {
      // Create under parcel-delivery (or goods-transport if parcel doesn't exist)
      const svc = parcelService || goodsService;
      if (!svc) {
        console.log(`  ⚠ No service found for ${v.name} — skipping`);
        continue;
      }
      await db.vehicle.create({
        data: {
          name: v.name,
          slug: v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
          serviceId: svc.id,
          maxLoad: v.maxLoad,
          status: "Active",
        },
      });
      console.log(`  ✅ Created vehicle: ${v.name} (${v.maxLoad})`);
    }
  }

  // 2. Update PriceMaster with slab-based pricing for each vehicle
  console.log("\n=== Updating price master with slab pricing ===\n");
  const services = await db.service.findMany();
  const serviceIds = services.map(s => s.id);

  for (const v of VEHICLES) {
    const vehicle = await db.vehicle.findFirst({ where: { name: v.name } }).catch(() => null);
    if (!vehicle) continue;

    const slabs = SLABS[v.name as keyof typeof SLABS];
    if (!slabs) continue;

    // Find existing price master for this vehicle
    const existingPrice = await db.priceMaster.findFirst({
      where: { vehicleId: vehicle.id },
    }).catch(() => null);

    const priceData = {
      minimumKm: 2,
      freeKm: 0,
      minimumFare: v.baseFare,
      perKmRate: v.perKm,
      extraKmRate: v.perKm,
      slabJson: JSON.stringify(slabs),
      waitingCharge: v.waitPerMin,
      helperCharge: 0,
      gstPercent: 5,
      commissionPercent: 10,
      platformFee: 5,
      status: "Active",
    };

    if (existingPrice) {
      await db.priceMaster.update({
        where: { id: existingPrice.id },
        data: priceData,
      });
      console.log(`  ✅ Updated price: ${v.name} — base ₹${v.baseFare}, ₹${v.perKm}/km, ${slabs.length} slabs`);
    } else {
      // Create new price master entries for each service (so all services show this vehicle)
      for (const svcId of serviceIds.slice(0, 2)) { // Just parcel + goods
        await db.priceMaster.create({
          data: {
            serviceId: svcId,
            vehicleId: vehicle.id,
            itemType: v.name,
            pricingType: "slab",
            ...priceData,
          },
        }).catch(() => {});
      }
      console.log(`  ✅ Created price: ${v.name} — base ₹${v.baseFare}, ₹${v.perKm}/km, ${slabs.length} slabs`);
    }
  }

  // 3. Save surge pricing as settings
  console.log("\n=== Saving surge pricing ===\n");
  await db.settings.upsert({
    where: { key: "surge_pricing_slots" },
    create: { key: "surge_pricing_slots", value: JSON.stringify(SURGE_SLOTS), type: "json" },
    update: { value: JSON.stringify(SURGE_SLOTS), type: "json" },
  });
  console.log(`  ✅ Saved ${SURGE_SLOTS.length} surge time slots`);

  // 4. Update/create discount coupons
  console.log("\n=== Updating discount coupons ===\n");
  for (const c of COUPONS) {
    const existing = await db.coupon.findUnique({ where: { code: c.code } }).catch(() => null);
    if (existing) {
      await db.coupon.update({
        where: { id: existing.id },
        data: {
          description: c.description,
          discountType: c.discountType,
          discountValue: c.discountValue,
          maxDiscount: c.maxDiscount,
          minOrderAmount: c.minOrderAmount,
          usageLimit: c.usageLimit,
          status: "Active",
        },
      });
      console.log(`  ✅ Updated coupon: ${c.code} — ${c.description}`);
    } else {
      await db.coupon.create({
        data: {
          code: c.code,
          description: c.description,
          discountType: c.discountType,
          discountValue: c.discountValue,
          maxDiscount: c.maxDiscount,
          minOrderAmount: c.minOrderAmount,
          usageLimit: c.usageLimit,
          status: "Active",
        },
      });
      console.log(`  ✅ Created coupon: ${c.code} — ${c.description}`);
    }
  }

  // 5. Verify
  console.log("\n=== FINAL STATE ===\n");
  const vehicleCount = await db.vehicle.count();
  const priceCount = await db.priceMaster.count();
  const couponCount = await db.coupon.count();
  console.log(`  Vehicles: ${vehicleCount}`);
  console.log(`  Price master rows: ${priceCount}`);
  console.log(`  Coupons: ${couponCount}`);

  // Show sample pricing for 2 Wheeler
  const sampleVehicle = await db.vehicle.findFirst({ where: { name: "2 Wheeler" } }).catch(() => null);
  if (sampleVehicle) {
    const samplePrice = await db.priceMaster.findFirst({ where: { vehicleId: sampleVehicle.id } }).catch(() => null);
    if (samplePrice) {
      console.log(`\n  Sample — 2 Wheeler pricing:`);
      console.log(`    Base fare: ₹${samplePrice.minimumFare}`);
      console.log(`    Per km: ₹${samplePrice.perKmRate}`);
      console.log(`    Slabs: ${samplePrice.slabJson}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
