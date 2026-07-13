// Add 17 industrial services as a new shop with products
// Categories: machinery, handling, warehouse, packaging
import { db } from "@/lib/db";

const INDUSTRIAL_PRODUCTS = [
  // Machinery
  { id: "forklift-1t", name: "Forklift (1 Ton)", category: "Machinery", basePrice: 2500, unit: "day" },
  { id: "forklift-3t", name: "Forklift (3 Ton)", category: "Machinery", basePrice: 4500, unit: "day" },
  { id: "eot-crane-1t", name: "EOT Crane (1 Ton)", category: "Machinery", basePrice: 8000, unit: "day" },
  { id: "excavator", name: "Excavator (Crawler)", category: "Machinery", basePrice: 15000, unit: "day" },
  { id: "tower-crane", name: "Tower Crane (50m)", category: "Machinery", basePrice: 35000, unit: "day" },
  // Handling
  { id: "pallet-manual", name: "Manual Pallet Truck", category: "Handling Equipment", basePrice: 800, unit: "day" },
  { id: "pallet-powered", name: "Powered Pallet Truck", category: "Handling Equipment", basePrice: 1800, unit: "day" },
  { id: "stacker", name: "Stacker (1.5T)", category: "Handling Equipment", basePrice: 1200, unit: "day" },
  { id: "conveyor", name: "Conveyor Belt (10m)", category: "Handling Equipment", basePrice: 3000, unit: "day" },
  // Warehouse
  { id: "warehouse-1000", name: "Warehouse (1000 sqft)", category: "Warehousing", basePrice: 20000, unit: "month" },
  { id: "warehouse-5000", name: "Warehouse (5000 sqft)", category: "Warehousing", basePrice: 90000, unit: "month" },
  { id: "cold-storage", name: "Cold Storage (500 sqft)", category: "Warehousing", basePrice: 45000, unit: "month" },
  // Packaging
  { id: "carton-box", name: "Carton Box (20x20x20 cm)", category: "Packaging", basePrice: 25, unit: "piece" },
  { id: "corrugated-sheet", name: "Corrugated Sheet (A4)", category: "Packaging", basePrice: 15, unit: "piece" },
  { id: "packaging-tape", name: "Packaging Tape (50m)", category: "Packaging", basePrice: 80, unit: "roll" },
  { id: "wooden-pallet", name: "Wooden Pallet (120x100cm)", category: "Packaging", basePrice: 450, unit: "piece" },
  { id: "bubble-wrap", name: "Bubble Wrap (10m roll)", category: "Packaging", basePrice: 120, unit: "roll" },
];

// Update discount coupons to match spec (some already exist — update values)
const DISCOUNTS = [
  { code: "FIRST20", description: "First Order — 20% OFF", discountType: "percent", discountValue: 20, maxDiscount: 500, minOrderAmount: 0, usageLimit: 1000 },
  { code: "REFER100", description: "Referral — ₹100 OFF", discountType: "fixed", discountValue: 100, maxDiscount: 100, minOrderAmount: 200, usageLimit: 5000 },
  { code: "WEEKLY50", description: "Weekly Offer — ₹50 OFF", discountType: "fixed", discountValue: 50, maxDiscount: 50, minOrderAmount: 100, usageLimit: 10000 },
  { code: "FESTIVE15", description: "Festival — 15% OFF", discountType: "percent", discountValue: 15, maxDiscount: 750, minOrderAmount: 500, usageLimit: 2000 },
  { code: "CORP10", description: "Corporate — 10% OFF", discountType: "percent", discountValue: 10, maxDiscount: 1000, minOrderAmount: 1000, usageLimit: 1000 },
  { code: "BULK12", description: "Bulk Order — 12% OFF", discountType: "percent", discountValue: 12, maxDiscount: 800, minOrderAmount: 2000, usageLimit: 500 },
];

// 8 time slots (surge pricing) — save as settings
const TIME_SLOTS = [
  { label: "6:00 AM - 8:00 AM", multiplier: 1.0, name: "Normal" },
  { label: "8:00 AM - 10:00 AM", multiplier: 1.2, name: "Peak 1" },
  { label: "10:00 AM - 12:00 PM", multiplier: 1.1, name: "Medium" },
  { label: "12:00 PM - 4:00 PM", multiplier: 1.0, name: "Normal" },
  { label: "4:00 PM - 6:00 PM", multiplier: 1.3, name: "Peak 2" },
  { label: "6:00 PM - 8:00 PM", multiplier: 1.4, name: "Peak 3" },
  { label: "8:00 PM - 10:00 PM", multiplier: 1.2, name: "Medium" },
  { label: "10:00 PM - 6:00 AM", multiplier: 1.5, name: "Night" },
];

async function main() {
  console.log("=== Adding Industrial Services Shop + 17 Products ===\n");

  // 1. Create the industrial services shop
  let shop = await db.supplier.findFirst({ where: { supplierType: "Industrial Services" } }).catch(() => null);
  if (!shop) {
    shop = await db.supplier.create({
      data: {
        supplierName: "ParcelMaadi Industrial Services",
        shopName: "ParcelMaadi Industrial — Machinery, Warehouse & Packaging",
        supplierType: "Industrial Services",
        address: "Industrial Area, Peenya, Bengaluru 560058",
        mobile: "9845088888",
        whatsapp: "919845088888",
        flatDeliveryFee: 0,
        status: "Approved",
      },
    });
    console.log(`✅ Created shop: ${shop.shopName} (id: ${shop.id})`);
  } else {
    console.log(`⏭️  Shop exists: ${shop.shopName}`);
  }

  // 2. Add 17 products
  let inserted = 0;
  let skipped = 0;
  for (const p of INDUSTRIAL_PRODUCTS) {
    const existing = await db.product.findFirst({
      where: { supplierId: shop.id, productName: p.name },
    }).catch(() => null);
    if (existing) {
      // Update price
      await db.product.update({
        where: { id: existing.id },
        data: {
          mrp: Math.round(p.basePrice * 1.18), // MRP = base + 18% GST
          supplierPrice: p.basePrice,
          sellingPrice: p.basePrice,
          unit: p.unit,
          category: p.category,
          status: "Active",
          stock: 999, // Always available for rental
        },
      });
      skipped++;
      continue;
    }
    await db.product.create({
      data: {
        supplierId: shop.id,
        category: p.category,
        productName: p.name,
        brand: "ParcelMaadi Industrial",
        unit: p.unit,
        mrp: Math.round(p.basePrice * 1.18),
        marketLowPrice: p.basePrice,
        marketHighPrice: Math.round(p.basePrice * 1.18),
        supplierPrice: p.basePrice,
        sellingPrice: p.basePrice,
        marginPercent: 0, // No margin on rental — service
        gstPercent: 18,
        handlingFee: 0,
        stock: 999,
        city: "Bengaluru",
        pincode: "560058",
        photoUrl: "https://sfile.chatglm.cn/images-ppt/c8230f22c1ad.jpg",
        status: "Active",
      },
    });
    inserted++;
  }
  console.log(`\n✅ Products: ${inserted} new, ${skipped} updated`);

  // 3. Update discount coupons
  console.log("\n=== Updating discount coupons ===");
  for (const c of DISCOUNTS) {
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
      console.log(`  ✅ Updated: ${c.code} — ${c.description}`);
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
      console.log(`  ✅ Created: ${c.code} — ${c.description}`);
    }
  }

  // 4. Save time slots as settings
  await db.settings.upsert({
    where: { key: "surge_time_slots" },
    create: { key: "surge_time_slots", value: JSON.stringify(TIME_SLOTS), type: "json" },
    update: { value: JSON.stringify(TIME_SLOTS), type: "json" },
  });
  console.log(`\n✅ Saved ${TIME_SLOTS.length} surge time slots`);

  // 5. Final stats
  const totalShops = await db.supplier.count();
  const totalProducts = await db.product.count();
  const totalCoupons = await db.coupon.count();
  console.log(`\n=== FINAL STATE ===`);
  console.log(`  Total shops: ${totalShops}`);
  console.log(`  Total products: ${totalProducts}`);
  console.log(`  Total coupons: ${totalCoupons}`);

  // Show industrial products by category
  const industrialProducts = await db.product.findMany({
    where: { supplierId: shop.id },
    orderBy: { category: "asc" },
  });
  console.log(`\n=== Industrial Services Products ===`);
  const byCat: Record<string, number> = {};
  for (const p of industrialProducts) {
    byCat[p.category || "Other"] = (byCat[p.category || "Other"] || 0) + 1;
  }
  for (const [cat, count] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${count} items`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
