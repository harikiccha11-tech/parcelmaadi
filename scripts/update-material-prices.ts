// Execute the SQL spec: update material prices + add sample grocery products + reset sequences
import { db } from "@/lib/db";

async function main() {
  console.log("=== 1. SET UNIFORM PRICES FOR ALL MATERIALS (Service ID = 3) ===\n");

  // Update PriceMaster per_unit_rate for materials
  const materialPrices: Record<string, number> = {
    "Sand (River)": 1200,
    "M-Sand": 950,
    "Cement": 390,
    "Steel": 65,
    "Bricks": 8,
    "Blocks": 32,
    "Jelly Aggregate": 850,
    "Stone": 1100,
    "Soil": 450,
    "Other Materials": 1500,
  };

  // Find material supply service
  const materialService = await db.service.findUnique({ where: { slug: "material-supply" } }).catch(() => null);
  if (!materialService) {
    console.log("⚠ Material Supply service not found — skipping price updates");
  } else {
    console.log(`Material Supply service ID: ${materialService.id}`);
    
    // Get existing price master rows for this service
    const existingPrices = await db.priceMaster.findMany({
      where: { serviceId: materialService.id },
    });
    console.log(`Found ${existingPrices.length} existing price master rows for material-supply`);

    // Update each material price
    let updated = 0;
    for (const [itemType, price] of Object.entries(materialPrices)) {
      const existing = await db.priceMaster.findFirst({
        where: { serviceId: materialService.id, itemType },
      }).catch(() => null);
      
      if (existing) {
        await db.priceMaster.update({
          where: { id: existing.id },
          data: {
            perUnitRate: price,
            unitType: itemType.includes("Bag") ? "Bag" : itemType.includes("Kg") ? "Kg" : itemType.includes("Piece") ? "Piece" : "Ton",
            pricingType: "per_unit",
            status: "Active",
          },
        });
        updated++;
        console.log(`  ✅ Updated ${itemType}: ₹${price}/${materialPrices[itemType]}`);
      } else {
        // Create new price master entry
        await db.priceMaster.create({
          data: {
            serviceId: materialService.id,
            itemType,
            pricingType: "per_unit",
            unitType: itemType.includes("Bag") ? "Bag" : itemType.includes("Kg") ? "Kg" : itemType.includes("Piece") ? "Piece" : "Ton",
            perUnitRate: price,
            minimumKm: 1,
            minimumFare: price,
            gstPercent: 5,
            commissionPercent: 10,
            status: "Active",
          },
        });
        updated++;
        console.log(`  ✅ Created ${itemType}: ₹${price}/unit`);
      }
    }
    console.log(`\n  → Updated/Created ${updated} material price entries`);
  }

  console.log("\n=== 2. ADD SAMPLE GROCERY PRODUCTS ===\n");

  // Find supplier ID 1 (or first approved supplier)
  const supplier = await db.supplier.findFirst({ where: { id: 1 } }).catch(() => null);
  if (!supplier) {
    console.log("⚠ Supplier ID 1 not found — using first approved supplier");
  }
  const supplierId = supplier?.id || (await db.supplier.findFirst({ where: { status: "Approved" } }))?.id;
  
  if (!supplierId) {
    console.log("⚠ No supplier found — skipping product insert");
  } else {
    console.log(`Using supplier ID: ${supplierId} (${supplier?.shopName || "Unknown"})`);

    const sampleProducts = [
      { name: "Basmati Rice", brand: "India Gate", category: "Grocery", subcategory: "Rice", packSize: "1 kg", unit: "kg", mrp: 120, sellingPrice: 110, img: "https://sfile.chatglm.cn/images-ppt/429abe75b078.jpg" },
      { name: "Whole Wheat Atta", brand: "Ashirvaad", category: "Grocery", subcategory: "Flour", packSize: "5 kg", unit: "kg", mrp: 240, sellingPrice: 220, img: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
      { name: "Sunflower Oil", brand: "Fortune", category: "Grocery", subcategory: "Oil", packSize: "1 L", unit: "litre", mrp: 180, sellingPrice: 165, img: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
      { name: "Toor Dal", brand: "Tata Sampann", category: "Grocery", subcategory: "Pulses", packSize: "1 kg", unit: "kg", mrp: 140, sellingPrice: 130, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
      { name: "White Sugar", brand: "Madhur", category: "Grocery", subcategory: "Sweeteners", packSize: "1 kg", unit: "kg", mrp: 45, sellingPrice: 42, img: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
    ];

    let inserted = 0;
    let skipped = 0;
    for (const p of sampleProducts) {
      const existing = await db.product.findFirst({
        where: { supplierId, productName: p.name, brand: p.brand },
      }).catch(() => null);
      
      if (existing) {
        // Update price
        await db.product.update({
          where: { id: existing.id },
          data: {
            mrp: p.mrp,
            sellingPrice: p.sellingPrice,
            supplierPrice: p.sellingPrice - 10,
            marketLowPrice: p.sellingPrice - 10,
            marketHighPrice: p.mrp,
            packSize: p.packSize,
            unit: p.unit,
            category: p.category,
            subcategory: p.subcategory,
            status: "Active",
            photoUrl: p.img,
            city: "Bengaluru",
            pincode: "560001",
          },
        });
        skipped++;
        console.log(`  ⏭️  Updated: ${p.name} (${p.brand}) — ₹${p.sellingPrice}/${p.unit}`);
      } else {
        await db.product.create({
          data: {
            supplierId,
            category: p.category,
            subcategory: p.subcategory,
            productName: p.name,
            brand: p.brand,
            packSize: p.packSize,
            unit: p.unit,
            mrp: p.mrp,
            marketLowPrice: p.sellingPrice - 10,
            marketHighPrice: p.mrp,
            supplierPrice: p.sellingPrice - 10,
            sellingPrice: p.sellingPrice,
            marginPercent: 10,
            gstPercent: 5,
            handlingFee: 0,
            stock: 100,
            city: "Bengaluru",
            pincode: "560001",
            photoUrl: p.img,
            status: "Active",
          },
        });
        inserted++;
        console.log(`  ✅ Created: ${p.name} (${p.brand}) — ₹${p.sellingPrice}/${p.unit}`);
      }
    }
    console.log(`\n  → ${inserted} new products, ${skipped} updated`);
  }

  console.log("\n=== 3. VERIFY MATERIAL IMAGES ===\n");
  
  if (materialService) {
    const materialVehicles = await db.vehicle.findMany({
      where: { serviceId: materialService.id },
      select: { id: true, name: true, imageUrl: true },
    });
    console.log(`Material vehicles: ${materialVehicles.length}`);
    const seen = new Set<string>();
    for (const v of materialVehicles) {
      const isDup = v.imageUrl && seen.has(v.imageUrl);
      console.log(`  [${v.id}] ${v.name}: ${v.imageUrl || "NO IMAGE"} ${isDup ? "⚠ DUPLICATE" : ""}`);
      if (v.imageUrl) seen.add(v.imageUrl);
    }
  }

  console.log("\n=== 4. RESET SEQUENCES ===\n");

  // Reset sequences
  await db.$executeRawUnsafe('SELECT setval(\'"PriceMaster_id_seq"\', (SELECT COALESCE(MAX(id), 1) FROM "PriceMaster"))');
  console.log("  ✅ PriceMaster sequence reset");
  await db.$executeRawUnsafe('SELECT setval(\'"Product_id_seq"\', (SELECT COALESCE(MAX(id), 1) FROM "Product"))');
  console.log("  ✅ Product sequence reset");

  console.log("\n=== DONE ===\n");

  // Final verification
  const totalPrices = await db.priceMaster.count();
  const totalProducts = await db.product.count();
  console.log(`Total PriceMaster rows: ${totalPrices}`);
  console.log(`Total Products: ${totalProducts}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
