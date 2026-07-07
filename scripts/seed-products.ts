// Add sample products to the 4 existing suppliers so the Shops page shows them
import { db } from "@/lib/db";

interface ProductSeed {
  supplierId: number;
  category: string;
  subcategory?: string;
  productName: string;
  brand?: string;
  packSize?: string;
  unit?: string;
  mrp: number;
  supplierPrice: number;
  sellingPrice: number;
  marketLowPrice?: number;
  marketHighPrice?: number;
  marginPercent?: number;
  gstPercent?: number;
  handlingFee?: number;
  stock?: number;
  city?: string;
  pincode?: string;
  photoUrl?: string;
  status?: string;
}

const SAMPLE_PRODUCTS: ProductSeed[] = [
  // === Shop 1: Sri Lakshmi Hardware & Sand (Material) ===
  { supplierId: 1, category: "Cement", productName: "UltraTech PPC Cement", brand: "UltraTech", packSize: "50 kg", unit: "Bag", mrp: 420, supplierPrice: 380, sellingPrice: 410, marketLowPrice: 380, marketHighPrice: 430, marginPercent: 8, gstPercent: 18, stock: 200, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
  { supplierId: 1, category: "Cement", productName: "ACC Gold Cement", brand: "ACC", packSize: "50 kg", unit: "Bag", mrp: 430, supplierPrice: 390, sellingPrice: 420, marketLowPrice: 390, marketHighPrice: 440, marginPercent: 8, gstPercent: 18, stock: 150, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
  { supplierId: 1, category: "Sand", productName: "M-Sand (Manufactured)", unit: "Cubic Feet", mrp: 60, supplierPrice: 45, sellingPrice: 55, marketLowPrice: 45, marketHighPrice: 65, marginPercent: 18, gstPercent: 5, stock: 5000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
  { supplierId: 1, category: "Sand", productName: "P-Sand (Plastering)", unit: "Cubic Feet", mrp: 70, supplierPrice: 55, sellingPrice: 65, marketLowPrice: 55, marketHighPrice: 75, marginPercent: 18, gstPercent: 5, stock: 3000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
  { supplierId: 1, category: "Steel", productName: "TMT Steel Bar 12mm", brand: "Fe-500", unit: "Ton", mrp: 62000, supplierPrice: 58000, sellingPrice: 60500, marketLowPrice: 58000, marketHighPrice: 63000, marginPercent: 4, gstPercent: 18, stock: 50, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
  { supplierId: 1, category: "Bricks", productName: "Red Clay Brick (Class A)", unit: "Piece", mrp: 12, supplierPrice: 9, sellingPrice: 11, marketLowPrice: 9, marketHighPrice: 13, marginPercent: 18, gstPercent: 5, stock: 50000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },
  { supplierId: 1, category: "Blocks", productName: "Solid Concrete Block 6 inch", unit: "Piece", mrp: 45, supplierPrice: 35, sellingPrice: 42, marketLowPrice: 35, marketHighPrice: 48, marginPercent: 18, gstPercent: 5, stock: 5000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png" },
  { supplierId: 1, category: "Jelly", productName: "20mm Jelly Stone", unit: "Cubic Feet", mrp: 75, supplierPrice: 55, sellingPrice: 68, marketLowPrice: 55, marketHighPrice: 78, marginPercent: 19, gstPercent: 5, stock: 8000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },

  // === Shop 2: Ganesh Cement & Steel (Material) ===
  { supplierId: 2, category: "Cement", productName: "Zuari PPC Cement", brand: "Zuari", packSize: "50 kg", unit: "Bag", mrp: 410, supplierPrice: 375, sellingPrice: 400, marketLowPrice: 375, marketHighPrice: 420, marginPercent: 7, gstPercent: 18, stock: 180, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
  { supplierId: 2, category: "Cement", productName: "Birla A1 OPC 53 Grade", brand: "Birla A1", packSize: "50 kg", unit: "Bag", mrp: 460, supplierPrice: 420, sellingPrice: 445, marketLowPrice: 420, marketHighPrice: 470, marginPercent: 6, gstPercent: 18, stock: 120, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
  { supplierId: 2, category: "Steel", productName: "TMT Steel Bar 8mm", brand: "Fe-500", unit: "Ton", mrp: 65000, supplierPrice: 60000, sellingPrice: 62500, marketLowPrice: 60000, marketHighPrice: 66000, marginPercent: 4, gstPercent: 18, stock: 30, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
  { supplierId: 2, category: "Steel", productName: "TMT Steel Bar 16mm", brand: "Fe-500", unit: "Ton", mrp: 61500, supplierPrice: 57500, sellingPrice: 60000, marketLowPrice: 57500, marketHighPrice: 62500, marginPercent: 4, gstPercent: 18, stock: 40, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
  { supplierId: 2, category: "Sand", productName: "River Sand (Premium)", unit: "Cubic Feet", mrp: 95, supplierPrice: 75, sellingPrice: 88, marketLowPrice: 75, marketHighPrice: 100, marginPercent: 16, gstPercent: 5, stock: 2000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/1b5dc2ac5b27.jpeg" },
  { supplierId: 2, category: "Bricks", productName: "Fly Ash Brick (Class A)", unit: "Piece", mrp: 14, supplierPrice: 10, sellingPrice: 13, marketLowPrice: 10, marketHighPrice: 15, marginPercent: 22, gstPercent: 5, stock: 30000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },

  // === Shop 3: Malleshwara Building Materials ===
  { supplierId: 3, category: "Cement", productName: "Shree PPC Cement", brand: "Shree", packSize: "50 kg", unit: "Bag", mrp: 400, supplierPrice: 365, sellingPrice: 390, marketLowPrice: 365, marketHighPrice: 410, marginPercent: 7, gstPercent: 18, stock: 220, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
  { supplierId: 3, category: "Steel", productName: "TMT Steel Bar 10mm", brand: "Fe-500", unit: "Ton", mrp: 63500, supplierPrice: 59000, sellingPrice: 61500, marketLowPrice: 59000, marketHighPrice: 64500, marginPercent: 4, gstPercent: 18, stock: 35, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
  { supplierId: 3, category: "Steel", productName: "TMT Steel Bar 20mm", brand: "Fe-500", unit: "Ton", mrp: 61000, supplierPrice: 57000, sellingPrice: 59500, marketLowPrice: 57000, marketHighPrice: 62000, marginPercent: 4, gstPercent: 18, stock: 25, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
  { supplierId: 3, category: "Sand", productName: "Concrete Sand", unit: "Cubic Feet", mrp: 65, supplierPrice: 48, sellingPrice: 58, marketLowPrice: 48, marketHighPrice: 70, marginPercent: 18, gstPercent: 5, stock: 6000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
  { supplierId: 3, category: "Jelly", productName: "40mm Jelly Stone", unit: "Cubic Feet", mrp: 70, supplierPrice: 50, sellingPrice: 62, marketLowPrice: 50, marketHighPrice: 75, marginPercent: 19, gstPercent: 5, stock: 7000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },
  { supplierId: 3, category: "Jelly", productName: "12mm Jelly Stone", unit: "Cubic Feet", mrp: 80, supplierPrice: 60, sellingPrice: 73, marketLowPrice: 60, marketHighPrice: 85, marginPercent: 18, gstPercent: 5, stock: 5500, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/2d3316213043.png" },
  { supplierId: 3, category: "Blocks", productName: "AAC Block 600x200x150", unit: "Piece", mrp: 80, supplierPrice: 60, sellingPrice: 75, marketLowPrice: 60, marketHighPrice: 85, marginPercent: 20, gstPercent: 5, stock: 2000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png" },

  // === Shop 4: Hosur Road Construction Supply ===
  { supplierId: 4, category: "Cement", productName: "Ramco PPC Cement", brand: "Ramco", packSize: "50 kg", unit: "Bag", mrp: 425, supplierPrice: 385, sellingPrice: 415, marketLowPrice: 385, marketHighPrice: 435, marginPercent: 8, gstPercent: 18, stock: 200, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg" },
  { supplierId: 4, category: "Steel", productName: "TMT Steel Bar 25mm", brand: "Fe-500", unit: "Ton", mrp: 60500, supplierPrice: 56500, sellingPrice: 59000, marketLowPrice: 56500, marketHighPrice: 61500, marginPercent: 4, gstPercent: 18, stock: 20, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
  { supplierId: 4, category: "Steel", productName: "MS Round Bar 16mm", brand: "MS", unit: "Ton", mrp: 58000, supplierPrice: 54000, sellingPrice: 56500, marketLowPrice: 54000, marketHighPrice: 59000, marginPercent: 5, gstPercent: 18, stock: 15, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg" },
  { supplierId: 4, category: "Sand", productName: "Filler Sand", unit: "Cubic Feet", mrp: 50, supplierPrice: 35, sellingPrice: 45, marketLowPrice: 35, marketHighPrice: 55, marginPercent: 22, gstPercent: 5, stock: 10000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg" },
  { supplierId: 4, category: "Bricks", productName: "Wire Cut Brick", unit: "Piece", mrp: 14, supplierPrice: 10, sellingPrice: 13, marketLowPrice: 10, marketHighPrice: 15, marginPercent: 23, gstPercent: 5, stock: 20000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/500619644178.jpg" },
  { supplierId: 4, category: "Stone", productName: "Granite Stone Chips", unit: "Cubic Feet", mrp: 85, supplierPrice: 65, sellingPrice: 78, marketLowPrice: 65, marketHighPrice: 90, marginPercent: 18, gstPercent: 5, stock: 4000, city: "Hosadurga", pincode: "577515", status: "Active", photoUrl: "https://sfile.chatglm.cn/images-ppt/16d230ccc5c2.png" },
];

async function main() {
  console.log(`Adding ${SAMPLE_PRODUCTS.length} sample products to suppliers...`);

  // Clear existing products first (idempotent re-run)
  await db.product.deleteMany({});
  console.log("Cleared existing products");

  // Insert in batches
  for (const p of SAMPLE_PRODUCTS) {
    await db.product.create({
      data: {
        supplierId: p.supplierId,
        category: p.category,
        subcategory: p.subcategory,
        productName: p.productName,
        brand: p.brand,
        packSize: p.packSize,
        unit: p.unit,
        mrp: p.mrp,
        marketLowPrice: p.marketLowPrice ?? 0,
        marketHighPrice: p.marketHighPrice ?? 0,
        supplierPrice: p.supplierPrice,
        sellingPrice: p.sellingPrice,
        marginPercent: p.marginPercent ?? 10,
        gstPercent: p.gstPercent ?? 5,
        handlingFee: p.handlingFee ?? 0,
        stock: p.stock ?? 0,
        city: p.city,
        pincode: p.pincode,
        photoUrl: p.photoUrl,
        status: p.status ?? "Active",
      },
    });
  }

  // Verify
  const count = await db.product.count();
  console.log(`✅ Inserted ${count} products across 4 suppliers`);

  // Per-supplier breakdown
  const bySupplier = await db.product.groupBy({
    by: ["supplierId"],
    _count: { id: true },
  });
  for (const s of bySupplier) {
    const supplier = await db.supplier.findUnique({ where: { id: s.supplierId } });
    console.log(`  Supplier ${s.supplierId} (${supplier?.shopName}): ${s._count.id} products`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
