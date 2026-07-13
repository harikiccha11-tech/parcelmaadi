// Add brand-wise material products — multiple brands per material type
// Cement (6 brands already), Steel (add 6+ brands), Sand (types), Bricks (types), etc.
import { db } from "@/lib/db";

// Find material supply shops (suppliers 1-4)
async function main() {
  console.log("=== Adding brand-wise material products ===\n");

  // Get material shops
  const materialShops = await db.supplier.findMany({
    where: { supplierType: "Material" },
  });
  if (materialShops.length === 0) {
    console.log("⚠ No Material suppliers found");
    return;
  }
  const shopId = materialShops[0].id;
  console.log(`Using shop: ${materialShops[0].shopName} (id: ${shopId})`);

  // Brand-wise products — each material type has multiple brands/grades with different prices
  const BRAND_WISE_PRODUCTS = [
    // === CEMENT (6 brands — already exist, add 4 more) ===
    { category: "Cement", name: "JK Super Cement PPC", brand: "JK Super", packSize: "50 kg", unit: "Bag", mrp: 405, sp: 385, stock: 150, img: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
    { category: "Cement", name: "Priya Cement PPC", brand: "Priya", packSize: "50 kg", unit: "Bag", mrp: 395, sp: 375, stock: 130, img: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
    { category: "Cement", name: "Deccan Cement OPC 53", brand: "Deccan", packSize: "50 kg", unit: "Bag", mrp: 450, sp: 425, stock: 100, img: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
    { category: "Cement", name: "Coromandel King Cement", brand: "Coromandel", packSize: "50 kg", unit: "Bag", mrp: 420, sp: 395, stock: 110, img: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },

    // === STEEL (add 6+ brands) ===
    { category: "Steel", name: "TMT Steel Bar 12mm — Tata Tiscon", brand: "Tata Tiscon", packSize: "12mm", unit: "Ton", mrp: 68000, sp: 65000, stock: 20, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 12mm — JSW Neosteel", brand: "JSW Neosteel", packSize: "12mm", unit: "Ton", mrp: 67000, sp: 64000, stock: 25, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 12mm — Vizag Steel", brand: "Vizag (RINL)", packSize: "12mm", unit: "Ton", mrp: 66000, sp: 63000, stock: 15, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 12mm — SAIL TMT", brand: "SAIL", packSize: "12mm", unit: "Ton", mrp: 65500, sp: 62500, stock: 18, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 12mm — Kamdhenu", brand: "Kamdhenu", packSize: "12mm", unit: "Ton", mrp: 63000, sp: 60500, stock: 22, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 12mm — Essar TMT", brand: "Essar", packSize: "12mm", unit: "Ton", mrp: 62500, sp: 60000, stock: 16, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 8mm — Tata Tiscon", brand: "Tata Tiscon", packSize: "8mm", unit: "Ton", mrp: 69000, sp: 66000, stock: 12, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 8mm — JSW Neosteel", brand: "JSW Neosteel", packSize: "8mm", unit: "Ton", mrp: 68000, sp: 65000, stock: 14, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 16mm — Tata Tiscon", brand: "Tata Tiscon", packSize: "16mm", unit: "Ton", mrp: 67000, sp: 64500, stock: 18, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 16mm — JSW Neosteel", brand: "JSW Neosteel", packSize: "16mm", unit: "Ton", mrp: 66500, sp: 64000, stock: 20, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 20mm — Tata Tiscon", brand: "Tata Tiscon", packSize: "20mm", unit: "Ton", mrp: 66500, sp: 64000, stock: 10, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
    { category: "Steel", name: "TMT Steel Bar 25mm — SAIL TMT", brand: "SAIL", packSize: "25mm", unit: "Ton", mrp: 65000, sp: 62500, stock: 8, img: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },

    // === SAND (types with supplier names as brands) ===
    { category: "Sand", name: "River Sand Premium — Krishna Supply", brand: "Krishna River Sand", packSize: "Per Ton", unit: "Ton", mrp: 1400, sp: 1200, stock: 500, img: "https://sfile.chatglm.cn/images-ppt/1b5dc2ac5b27.jpeg" },
    { category: "Sand", name: "River Sand Standard — Cauvery Supply", brand: "Cauvery River Sand", packSize: "Per Ton", unit: "Ton", mrp: 1300, sp: 1100, stock: 600, img: "https://sfile.chatglm.cn/images-ppt/1b5dc2ac5b27.jpeg" },
    { category: "Sand", name: "M-Sand Premium — Robo Silicon", brand: "Robo Sand", packSize: "Per Ton", unit: "Ton", mrp: 1100, sp: 950, stock: 800, img: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
    { category: "Sand", name: "M-Sand Standard — Tavara Sand", brand: "Tavara M-Sand", packSize: "Per Ton", unit: "Ton", mrp: 1050, sp: 900, stock: 700, img: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
    { category: "Sand", name: "P-Sand Plastering — Robo Silicon", brand: "Robo P-Sand", packSize: "Per Ton", unit: "Ton", mrp: 1200, sp: 1050, stock: 400, img: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
    { category: "Sand", name: "Concrete Sand — Local Quarry", brand: "Local Quarry", packSize: "Per Ton", unit: "Ton", mrp: 900, sp: 750, stock: 1000, img: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
    { category: "Sand", name: "Filler Sand — Local Supply", brand: "Local Supply", packSize: "Per Ton", unit: "Ton", mrp: 700, sp: 550, stock: 1500, img: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },

    // === BRICKS (types with suppliers) ===
    { category: "Bricks", name: "Red Clay Brick Class A — Local Kiln", brand: "Local Kiln", packSize: "Per Piece", unit: "Piece", mrp: 12, sp: 10, stock: 50000, img: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },
    { category: "Bricks", name: "Red Clay Brick Class B — Local Kiln", brand: "Local Kiln", packSize: "Per Piece", unit: "Piece", mrp: 10, sp: 8, stock: 40000, img: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },
    { category: "Bricks", name: "Fly Ash Brick — BricKaat", brand: "BricKaat", packSize: "Per Piece", unit: "Piece", mrp: 14, sp: 12, stock: 30000, img: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },
    { category: "Bricks", name: "Wire Cut Brick — Premium", brand: "WireCut Co", packSize: "Per Piece", unit: "Piece", mrp: 16, sp: 14, stock: 20000, img: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },
    { category: "Bricks", name: "Concrete Brick — Solid", brand: "Concrete Brick Co", packSize: "Per Piece", unit: "Piece", mrp: 18, sp: 15, stock: 15000, img: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },

    // === BLOCKS (brands) ===
    { category: "Blocks", name: "Solid Concrete Block 6 inch — UltraTech", brand: "UltraTech Blocks", packSize: "6 inch", unit: "Piece", mrp: 50, sp: 45, stock: 5000, img: "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png" },
    { category: "Blocks", name: "Solid Concrete Block 8 inch — UltraTech", brand: "UltraTech Blocks", packSize: "8 inch", unit: "Piece", mrp: 60, sp: 55, stock: 3000, img: "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png" },
    { category: "Blocks", name: "AAC Block 600x200x150 — Birla Aerocon", brand: "Birla Aerocon", packSize: "600x200x150", unit: "Piece", mrp: 85, sp: 75, stock: 2000, img: "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png" },
    { category: "Blocks", name: "AAC Block 600x200x200 — Birla Aerocon", brand: "Birla Aerocon", packSize: "600x200x200", unit: "Piece", mrp: 95, sp: 85, stock: 1500, img: "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png" },
    { category: "Blocks", name: "Hollow Block 16 inch — Local", brand: "Local Blocks", packSize: "16 inch", unit: "Piece", mrp: 55, sp: 48, stock: 4000, img: "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png" },

    // === JELLY / AGGREGATE (suppliers) ===
    { category: "Jelly", name: "20mm Jelly — Granite Quarry", brand: "Granite Quarry", packSize: "Per Ton", unit: "Ton", mrp: 950, sp: 850, stock: 3000, img: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },
    { category: "Jelly", name: "40mm Jelly — Granite Quarry", brand: "Granite Quarry", packSize: "Per Ton", unit: "Ton", mrp: 900, sp: 800, stock: 2500, img: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },
    { category: "Jelly", name: "12mm Jelly — Local Crusher", brand: "Local Crusher", packSize: "Per Ton", unit: "Ton", mrp: 1000, sp: 900, stock: 2000, img: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },
    { category: "Jelly", name: "6mm Jelly Chips — Local Crusher", brand: "Local Crusher", packSize: "Per Ton", unit: "Ton", mrp: 1050, sp: 950, stock: 1500, img: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },
    { category: "Jelly", name: "Dust / Stone Dust — Quarry", brand: "Quarry Dust", packSize: "Per Ton", unit: "Ton", mrp: 600, sp: 500, stock: 4000, img: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },

    // === STONE (types) ===
    { category: "Stone", name: "Granite Stone Chips — Premium", brand: "Premium Granite", packSize: "Per Ton", unit: "Ton", mrp: 1300, sp: 1100, stock: 2000, img: "https://sfile.chatglm.cn/images-ppt/16d230ccc5c2.png" },
    { category: "Stone", name: "Granite Slab — Polished", brand: "Polished Granite", packSize: "Per SqFt", unit: "SqFt", mrp: 250, sp: 220, stock: 500, img: "https://sfile.chatglm.cn/images-ppt/16d230ccc5c2.png" },
    { category: "Stone", name: "Kota Stone — Natural", brand: "Kota Stone Co", packSize: "Per SqFt", unit: "SqFt", mrp: 80, sp: 65, stock: 800, img: "https://sfile.chatglm.cn/images-ppt/16d230ccc5c2.png" },
    { category: "Stone", name: "Marble Slab — White", brand: "Premium Marble", packSize: "Per SqFt", unit: "SqFt", mrp: 350, sp: 300, stock: 300, img: "https://sfile.chatglm.cn/images-ppt/16d230ccc5c2.png" },

    // === SOIL (types) ===
    { category: "Soil", name: "Red Soil — Premium", brand: "Local Soil", packSize: "Per Ton", unit: "Ton", mrp: 550, sp: 450, stock: 2000, img: "https://sfile.chatglm.cn/images-ppt/0e118cb75e13.jpg" },
    { category: "Soil", name: "Black Cotton Soil", brand: "Local Soil", packSize: "Per Ton", unit: "Ton", mrp: 500, sp: 400, stock: 1500, img: "https://sfile.chatglm.cn/images-ppt/0e118cb75e13.jpg" },
    { category: "Soil", name: "Alluvial Soil — Garden", brand: "Garden Soil Co", packSize: "Per Ton", unit: "Ton", mrp: 600, sp: 500, stock: 1000, img: "https://sfile.chatglm.cn/images-ppt/0e118cb75e13.jpg" },
  ];

  let inserted = 0;
  let skipped = 0;
  for (const p of BRAND_WISE_PRODUCTS) {
    const existing = await db.product.findFirst({
      where: { supplierId: shopId, productName: p.name, brand: p.brand },
    }).catch(() => null);
    if (existing) {
      // Update price + stock
      await db.product.update({
        where: { id: existing.id },
        data: {
          mrp: p.mrp,
          sellingPrice: p.sp,
          supplierPrice: p.sp - 20,
          marketLowPrice: p.sp - 20,
          marketHighPrice: p.mrp,
          packSize: p.packSize,
          unit: p.unit,
          stock: p.stock,
          photoUrl: p.img,
          status: "Active",
        },
      });
      skipped++;
    } else {
      await db.product.create({
        data: {
          supplierId: shopId,
          category: p.category,
          productName: p.name,
          brand: p.brand,
          packSize: p.packSize,
          unit: p.unit,
          mrp: p.mrp,
          marketLowPrice: p.sp - 20,
          marketHighPrice: p.mrp,
          supplierPrice: p.sp - 20,
          sellingPrice: p.sp,
          marginPercent: 10,
          gstPercent: 5,
          handlingFee: 0,
          stock: p.stock,
          city: "Bengaluru",
          pincode: "560001",
          photoUrl: p.img,
          status: "Active",
        },
      });
      inserted++;
    }
  }
  console.log(`✅ ${inserted} new products, ${skipped} updated\n`);

  // Summary by category + brand
  const allMaterialProducts = await db.product.findMany({
    where: { supplierId: shopId, category: { in: ["Cement","Steel","Sand","Bricks","Blocks","Jelly","Stone","Soil"] } },
    orderBy: [{ category: "asc" }, { brand: "asc" }],
  });
  console.log(`=== BRAND-WISE MATERIAL SUMMARY (${allMaterialProducts.length} products) ===\n`);
  const byCat: Record<string, any[]> = {};
  for (const p of allMaterialProducts) {
    if (!byCat[p.category!]) byCat[p.category!] = [];
    byCat[p.category!].push(p);
  }
  for (const [cat, items] of Object.entries(byCat)) {
    const brands = new Set(items.map(i => i.brand));
    console.log(`${cat} (${items.length} products, ${brands.size} brands):`);
    for (const b of brands) {
      const brandItems = items.filter(i => i.brand === b);
      console.log(`  ${b}: ${brandItems.length} item(s), ₹${brandItems[0].sellingPrice}/${brandItems[0].unit}`);
    }
    console.log();
  }

  const total = await db.product.count();
  console.log(`Total products in DB: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
