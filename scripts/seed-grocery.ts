// Add Grocery & Ration department with shops, products, and real images
import { db } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

function loadUrlMap(): Record<string, string> {
  const candidates = [
    "/home/z/my-project/scripts/images/grocery/url_map.json",
    path.join(process.cwd(), "scripts/images/grocery/url_map.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {}
  }
  console.warn("⚠ url_map.json not found — will use fallback images");
  return {};
}

const IMG = loadUrlMap();
console.log(`Loaded ${Object.keys(IMG).length} image URLs`);

// Fallback: generic grocery product image (sfile.chatglm.cn is the image CDN returned by image-search)
const FALLBACK = "https://sfile.chatglm.cn/images-ppt/4e2086f05be2.png";

function img(key: string): string {
  return IMG[key] || FALLBACK;
}

// 3 grocery shops across different areas
const GROCERY_SHOPS = [
  { id: 13, shopName: "Sri Lakshmi Grocery & Ration Store", supplierName: "Ramesh Gowda", supplierType: "Grocery", address: "Gandhi Bazaar, Bengaluru 560004", mobile: "9845011111", whatsapp: "919845011111", flatDeliveryFee: 30 },
  { id: 14, shopName: "Anand Super Bazaar", supplierName: "Suresh Jain", supplierType: "Grocery", address: "Jayanagar 4th Block, Bengaluru 560011", mobile: "9845022222", whatsapp: "919845022222", flatDeliveryFee: 40 },
  { id: 15, shopName: "Karnataka Ration & General Store", supplierName: "Mahesh Kumar", supplierType: "Grocery", address: "Malleshwaram 8th Cross, Bengaluru 560003", mobile: "9845033333", whatsapp: "919845033333", flatDeliveryFee: 35 },
];

// 48 grocery products with real images, spread across 3 shops
// Generic product names with brand info (standard retail listing practice)
interface P {
  supplierId: number;
  category: string;
  productName: string;
  brand?: string;
  packSize?: string;
  unit?: string;
  mrp: number;
  supplierPrice: number;
  sellingPrice: number;
  marginPercent?: number;
  gstPercent?: number;
  stock?: number;
  imgKey: string;
}

const PRODUCTS: P[] = [
  // === Shop 13: Sri Lakshmi Grocery ===
  // Staples
  { supplierId: 13, category: "Rice & Grains", productName: "Basmati Rice Premium Long Grain", brand: "Aashirvaad", packSize: "5 kg", unit: "Bag", mrp: 525, supplierPrice: 460, sellingPrice: 499, marginPercent: 8, gstPercent: 5, stock: 80, imgKey: "grocery_rice_basmati" },
  { supplierId: 13, category: "Rice & Grains", productName: "Sona Masoori Rice Medium Grain", brand: "India Gate", packSize: "5 kg", unit: "Bag", mrp: 410, supplierPrice: 360, sellingPrice: 389, marginPercent: 8, gstPercent: 5, stock: 60, imgKey: "grocery_rice_sona" },
  { supplierId: 13, category: "Atta & Flours", productName: "Whole Wheat Atta", brand: "Aashirvaad", packSize: "10 kg", unit: "Bag", mrp: 510, supplierPrice: 440, sellingPrice: 475, marginPercent: 8, gstPercent: 5, stock: 100, imgKey: "grocery_atta_aashirvaad" },
  { supplierId: 13, category: "Atta & Flours", productName: "Whole Wheat Atta", brand: "Pillsbury", packSize: "5 kg", unit: "Bag", mrp: 285, supplierPrice: 245, sellingPrice: 269, marginPercent: 9, gstPercent: 5, stock: 70, imgKey: "grocery_atta_pillsbury" },
  { supplierId: 13, category: "Atta & Flours", productName: "Maida Refined Flour", brand: "Aashirvaad", packSize: "1 kg", unit: "Pack", mrp: 55, supplierPrice: 42, sellingPrice: 49, marginPercent: 14, gstPercent: 5, stock: 200, imgKey: "grocery_maida" },
  { supplierId: 13, category: "Atta & Flours", productName: "Besan Gram Flour", brand: "Tata Sampann", packSize: "1 kg", unit: "Pack", mrp: 130, supplierPrice: 100, sellingPrice: 115, marginPercent: 13, gstPercent: 5, stock: 150, imgKey: "grocery_besan" },
  { supplierId: 13, category: "Atta & Flours", productName: "Rava Sooji Fine", brand: "Aashirvaad", packSize: "1 kg", unit: "Pack", mrp: 60, supplierPrice: 45, sellingPrice: 52, marginPercent: 14, gstPercent: 5, stock: 120, imgKey: "grocery_rava" },
  { supplierId: 13, category: "Atta & Flours", productName: "Poha Flattened Rice Thick", brand: "Tata Sampann", packSize: "500 g", unit: "Pack", mrp: 65, supplierPrice: 50, sellingPrice: 58, marginPercent: 14, gstPercent: 5, stock: 90, imgKey: "grocery_poha" },
  // Pulses
  { supplierId: 13, category: "Pulses & Lentils", productName: "Toor Dal Arhar", brand: "Tata Sampann", packSize: "1 kg", unit: "Pack", mrp: 175, supplierPrice: 145, sellingPrice: 165, marginPercent: 12, gstPercent: 0, stock: 100, imgKey: "grocery_toor_dal" },
  { supplierId: 13, category: "Pulses & Lentils", productName: "Moong Dal Yellow Split", brand: "Organic Tattva", packSize: "500 g", unit: "Pack", mrp: 110, supplierPrice: 85, sellingPrice: 99, marginPercent: 14, gstPercent: 0, stock: 80, imgKey: "grocery_moong_dal" },
  { supplierId: 13, category: "Pulses & Lentils", productName: "Chana Dal Bengal Gram", brand: "Tata Sampann", packSize: "1 kg", unit: "Pack", mrp: 130, supplierPrice: 100, sellingPrice: 115, marginPercent: 13, gstPercent: 0, stock: 90, imgKey: "grocery_chana_dal" },
  { supplierId: 13, category: "Pulses & Lentils", productName: "Urad Dal Black Whole", brand: "Organic Tattva", packSize: "1 kg", unit: "Pack", mrp: 180, supplierPrice: 145, sellingPrice: 165, marginPercent: 12, gstPercent: 0, stock: 60, imgKey: "grocery_urad_dal" },
  { supplierId: 13, category: "Pulses & Lentils", productName: "Rajma Red Kidney Beans", brand: "Tata Sampann", packSize: "500 g", unit: "Pack", mrp: 130, supplierPrice: 100, sellingPrice: 115, marginPercent: 13, gstPercent: 0, stock: 70, imgKey: "grocery_rajma" },
  { supplierId: 13, category: "Pulses & Lentils", productName: "Kabuli Chana White Chickpeas", brand: "Organic Tattva", packSize: "500 g", unit: "Pack", mrp: 95, supplierPrice: 72, sellingPrice: 85, marginPercent: 15, gstPercent: 0, stock: 80, imgKey: "grocery_chickpeas" },

  // === Shop 14: Anand Super Bazaar ===
  // Oils & Ghee
  { supplierId: 14, category: "Oils & Ghee", productName: "Refined Sunflower Oil", brand: "Fortune", packSize: "1 L", unit: "Bottle", mrp: 145, supplierPrice: 120, sellingPrice: 135, marginPercent: 11, gstPercent: 5, stock: 150, imgKey: "grocery_sunflower_oil" },
  { supplierId: 14, category: "Oils & Ghee", productName: "Groundnut Oil Refined", brand: "Fortune", packSize: "1 L", unit: "Bottle", mrp: 175, supplierPrice: 145, sellingPrice: 165, marginPercent: 12, gstPercent: 5, stock: 100, imgKey: "grocery_groundnut_oil" },
  { supplierId: 14, category: "Oils & Ghee", productName: "Mustard Oil Kachi Ghani", brand: "P Mark", packSize: "1 L", unit: "Bottle", mrp: 165, supplierPrice: 138, sellingPrice: 155, marginPercent: 11, gstPercent: 5, stock: 80, imgKey: "grocery_mustard_oil" },
  { supplierId: 14, category: "Oils & Ghee", productName: "Pure Cow Ghee", brand: "Amul", packSize: "1 L", unit: "Tin", mrp: 560, supplierPrice: 490, sellingPrice: 535, marginPercent: 9, gstPercent: 5, stock: 50, imgKey: "grocery_ghee" },
  { supplierId: 14, category: "Oils & Ghee", productName: "Coconut Oil Edible", brand: "Parachute", packSize: "500 ml", unit: "Bottle", mrp: 220, supplierPrice: 180, sellingPrice: 205, marginPercent: 12, gstPercent: 5, stock: 70, imgKey: "grocery_coconut_oil" },
  // Sugar & Salt
  { supplierId: 14, category: "Sugar & Salt", productName: "Refined White Sugar", brand: "Madhur", packSize: "1 kg", unit: "Pack", mrp: 50, supplierPrice: 38, sellingPrice: 45, marginPercent: 16, gstPercent: 5, stock: 300, imgKey: "grocery_sugar" },
  { supplierId: 14, category: "Sugar & Salt", productName: "Jaggery Natural Block", brand: "Mangal", packSize: "1 kg", unit: "Block", mrp: 75, supplierPrice: 55, sellingPrice: 65, marginPercent: 16, gstPercent: 5, stock: 120, imgKey: "grocery_jaggery" },
  { supplierId: 14, category: "Sugar & Salt", productName: "Iodised Salt", brand: "Tata Salt", packSize: "1 kg", unit: "Pack", mrp: 28, supplierPrice: 22, sellingPrice: 25, marginPercent: 13, gstPercent: 5, stock: 400, imgKey: "grocery_salt_tata" },
  { supplierId: 14, category: "Sugar & Salt", productName: "Sendha Namak Rock Salt", brand: "Tata Salt", packSize: "500 g", unit: "Pack", mrp: 60, supplierPrice: 45, sellingPrice: 52, marginPercent: 14, gstPercent: 5, stock: 150, imgKey: "grocery_rock_salt" },
  // Tea & Coffee
  { supplierId: 14, category: "Tea & Coffee", productName: "Premium Tea", brand: "Tata Tea", packSize: "500 g", unit: "Pack", mrp: 270, supplierPrice: 225, sellingPrice: 250, marginPercent: 11, gstPercent: 5, stock: 100, imgKey: "grocery_tea_tata" },
  { supplierId: 14, category: "Tea & Coffee", productName: "Premium Tea", brand: "Brooke Bond Red Label", packSize: "500 g", unit: "Pack", mrp: 275, supplierPrice: 230, sellingPrice: 255, marginPercent: 11, gstPercent: 5, stock: 100, imgKey: "grocery_tea_red_label" },
  { supplierId: 14, category: "Tea & Coffee", productName: "Instant Coffee", brand: "Bru", packSize: "100 g", unit: "Jar", mrp: 175, supplierPrice: 140, sellingPrice: 159, marginPercent: 13, gstPercent: 18, stock: 80, imgKey: "grocery_coffee_bru" },
  { supplierId: 14, category: "Tea & Coffee", productName: "Instant Coffee Gold", brand: "Nescafe", packSize: "100 g", unit: "Jar", mrp: 290, supplierPrice: 240, sellingPrice: 269, marginPercent: 12, gstPercent: 18, stock: 60, imgKey: "grocery_coffee_nescafe" },
  // Spices
  { supplierId: 14, category: "Spices & Masala", productName: "Turmeric Powder Haldi", brand: "Everest", packSize: "200 g", unit: "Pack", mrp: 80, supplierPrice: 60, sellingPrice: 70, marginPercent: 14, gstPercent: 5, stock: 200, imgKey: "grocery_turmeric" },
  { supplierId: 14, category: "Spices & Masala", productName: "Red Chilli Powder", brand: "Everest", packSize: "200 g", unit: "Pack", mrp: 95, supplierPrice: 72, sellingPrice: 82, marginPercent: 13, gstPercent: 5, stock: 180, imgKey: "grocery_chilli_powder" },
  { supplierId: 14, category: "Spices & Masala", productName: "Coriander Powder Dhania", brand: "Catch", packSize: "200 g", unit: "Pack", mrp: 75, supplierPrice: 56, sellingPrice: 65, marginPercent: 14, gstPercent: 5, stock: 150, imgKey: "grocery_coriander_powder" },
  { supplierId: 14, category: "Spices & Masala", productName: "Garam Masala", brand: "Everest", packSize: "100 g", unit: "Pack", mrp: 70, supplierPrice: 52, sellingPrice: 60, marginPercent: 13, gstPercent: 5, stock: 160, imgKey: "grocery_garam_masala" },
  { supplierId: 14, category: "Spices & Masala", productName: "Cumin Seeds Jeera", brand: "Catch", packSize: "100 g", unit: "Pack", mrp: 90, supplierPrice: 68, sellingPrice: 78, marginPercent: 13, gstPercent: 5, stock: 120, imgKey: "grocery_cumin_seeds" },
  { supplierId: 14, category: "Spices & Masala", productName: "Mustard Seeds Rai", brand: "Catch", packSize: "100 g", unit: "Pack", mrp: 45, supplierPrice: 33, sellingPrice: 38, marginPercent: 14, gstPercent: 5, stock: 130, imgKey: "grocery_mustard_seeds" },

  // === Shop 15: Karnataka Ration & General ===
  // Dairy
  { supplierId: 15, category: "Dairy", productName: "Milk Powder Full Cream", brand: "Amul", packSize: "500 g", unit: "Tin", mrp: 285, supplierPrice: 240, sellingPrice: 265, marginPercent: 10, gstPercent: 5, stock: 80, imgKey: "grocery_milk_powder" },
  { supplierId: 15, category: "Dairy", productName: "Toned Milk", brand: "Amul", packSize: "500 ml", unit: "Pouch", mrp: 27, supplierPrice: 22, sellingPrice: 25, marginPercent: 13, gstPercent: 0, stock: 500, imgKey: "grocery_milk_pouch" },
  { supplierId: 15, category: "Dairy", productName: "Fresh Dahi Curd", brand: "Amul", packSize: "200 g", unit: "Cup", mrp: 25, supplierPrice: 19, sellingPrice: 22, marginPercent: 14, gstPercent: 0, stock: 300, imgKey: "grocery_curD" },
  { supplierId: 15, category: "Dairy", productName: "Fresh Paneer", brand: "Amul", packSize: "200 g", unit: "Pack", mrp: 95, supplierPrice: 75, sellingPrice: 85, marginPercent: 12, gstPercent: 5, stock: 100, imgKey: "grocery_paneer" },
  { supplierId: 15, category: "Dairy", productName: "Salted Butter", brand: "Amul", packSize: "100 g", unit: "Pack", mrp: 56, supplierPrice: 45, sellingPrice: 52, marginPercent: 14, gstPercent: 12, stock: 150, imgKey: "grocery_butter" },
  { supplierId: 15, category: "Dairy", productName: "Cheese Slices", brand: "Amul", packSize: "200 g", unit: "Pack", mrp: 135, supplierPrice: 108, sellingPrice: 122, marginPercent: 12, gstPercent: 12, stock: 90, imgKey: "grocery_cheese" },
  // Snacks & Biscuits
  { supplierId: 15, category: "Biscuits & Snacks", productName: "Glucose Biscuits", brand: "Parle-G", packSize: "200 g", unit: "Pack", mrp: 20, supplierPrice: 15, sellingPrice: 18, marginPercent: 17, gstPercent: 18, stock: 800, imgKey: "grocery_biscuit_parity" },
  { supplierId: 15, category: "Biscuits & Snacks", productName: "Marie Gold Biscuits", brand: "Britannia", packSize: "200 g", unit: "Pack", mrp: 30, supplierPrice: 23, sellingPrice: 27, marginPercent: 16, gstPercent: 18, stock: 600, imgKey: "grocery_biscuit_marie" },
  { supplierId: 15, category: "Biscuits & Snacks", productName: "Rusk Toast Bread", brand: "Britannia", packSize: "200 g", unit: "Pack", mrp: 35, supplierPrice: 27, sellingPrice: 31, marginPercent: 14, gstPercent: 18, stock: 200, imgKey: "grocery_rusk" },
  { supplierId: 15, category: "Biscuits & Snacks", productName: "Instant Noodles Masala", brand: "Maggi", packSize: "4 pack", unit: "Pack", mrp: 56, supplierPrice: 44, sellingPrice: 50, marginPercent: 13, gstPercent: 18, stock: 400, imgKey: "grocery_noodles" },
  { supplierId: 15, category: "Biscuits & Snacks", productName: "Pasta Macaroni", brand: "Disano", packSize: "500 g", unit: "Pack", mrp: 95, supplierPrice: 72, sellingPrice: 82, marginPercent: 14, gstPercent: 18, stock: 150, imgKey: "grocery_pasta" },
  // Cleaning & Personal
  { supplierId: 15, category: "Cleaning", productName: "Detergent Powder", brand: "Surf Excel", packSize: "1 kg", unit: "Pack", mrp: 165, supplierPrice: 138, sellingPrice: 152, marginPercent: 10, gstPercent: 18, stock: 120, imgKey: "grocery_soap_surf" },
  { supplierId: 15, category: "Cleaning", productName: "Detergent Soap Bar", brand: "Wheel", packSize: "200 g", unit: "Piece", mrp: 30, supplierPrice: 22, sellingPrice: 26, marginPercent: 17, gstPercent: 18, stock: 300, imgKey: "grocery_soap_wheel" },
  { supplierId: 15, category: "Personal Care", productName: "Shampoo Strong & Long", brand: "Clinic Plus", packSize: "12 sachets", unit: "Pack", mrp: 60, supplierPrice: 45, sellingPrice: 52, marginPercent: 14, gstPercent: 18, stock: 200, imgKey: "grocery_shampoo" },
  { supplierId: 15, category: "Personal Care", productName: "Toothpaste Strong Teeth", brand: "Colgate", packSize: "200 g", unit: "Pack", mrp: 115, supplierPrice: 90, sellingPrice: 102, marginPercent: 13, gstPercent: 18, stock: 180, imgKey: "grocery_toothpaste" },
  { supplierId: 15, category: "Personal Care", productName: "Coconut Hair Oil Pure", brand: "Parachute", packSize: "200 ml", unit: "Bottle", mrp: 145, supplierPrice: 115, sellingPrice: 130, marginPercent: 13, gstPercent: 18, stock: 150, imgKey: "grocery_hair_oil" },
  // Beverages
  { supplierId: 15, category: "Beverages", productName: "Soft Drink Cola", brand: "Coca Cola", packSize: "750 ml", unit: "Bottle", mrp: 40, supplierPrice: 30, sellingPrice: 35, marginPercent: 15, gstPercent: 28, stock: 350, imgKey: "grocery_soft_drink" },
  { supplierId: 15, category: "Beverages", productName: "Mixed Fruit Juice", brand: "Real", packSize: "1 L", unit: "Pack", mrp: 120, supplierPrice: 95, sellingPrice: 108, marginPercent: 13, gstPercent: 12, stock: 100, imgKey: "grocery_juice" },
  { supplierId: 15, category: "Beverages", productName: "Mineral Water Bottle", brand: "Bisleri", packSize: "1 L", unit: "Bottle", mrp: 20, supplierPrice: 14, sellingPrice: 17, marginPercent: 19, gstPercent: 18, stock: 1000, imgKey: "grocery_water_bottle" },
];

async function main() {
  console.log("=== Adding Grocery & Ration Department ===\n");

  // Step 1: Add "Grocery & Ration" service (id 10, after Emergency Booking)
  const existingService = await db.service.findUnique({ where: { slug: "grocery-ration" } }).catch(() => null);
  if (!existingService) {
    await db.service.create({
      data: {
        name: "Grocery & Ration",
        slug: "grocery-ration",
        description: "Fresh groceries, ration, dal, rice, atta, oil, spices, dairy and daily essentials delivered to your doorstep.",
        imageUrl: img("grocery_rice_basmati"),
        icon: "shopping-cart",
        status: "Active",
        sortOrder: 10,
      },
    });
    console.log("✅ Added 'Grocery & Ration' service (slug: grocery-ration)");
  } else {
    console.log("⏭️  Service 'grocery-ration' already exists");
  }

  // Step 2: Add grocery shops (suppliers)
  for (const s of GROCERY_SHOPS) {
    const existing = await db.supplier.findUnique({ where: { id: s.id } }).catch(() => null);
    if (!existing) {
      await db.supplier.create({
        data: {
          id: s.id,
          supplierName: s.supplierName,
          shopName: s.shopName,
          supplierType: s.supplierType,
          address: s.address,
          mobile: s.mobile,
          whatsapp: s.whatsapp,
          flatDeliveryFee: s.flatDeliveryFee,
          status: "Approved",
        },
      });
      console.log(`✅ Created shop ${s.id}: ${s.shopName}`);
    } else {
      // Update type to Grocery if it was different
      await db.supplier.update({ where: { id: s.id }, data: { supplierType: "Grocery" } }).catch(() => {});
      console.log(`⏭️  Shop ${s.id} already exists: ${s.shopName}`);
    }
  }

  // Step 3: Add grocery products (skip existing)
  let inserted = 0;
  let skipped = 0;
  for (const p of PRODUCTS) {
    const existing = await db.product.findFirst({
      where: { supplierId: p.supplierId, productName: p.productName, brand: p.brand || null },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await db.product.create({
      data: {
        supplierId: p.supplierId,
        category: p.category,
        productName: p.productName,
        brand: p.brand,
        packSize: p.packSize,
        unit: p.unit,
        mrp: p.mrp,
        marketLowPrice: p.supplierPrice,
        marketHighPrice: p.mrp,
        supplierPrice: p.supplierPrice,
        sellingPrice: p.sellingPrice,
        marginPercent: p.marginPercent ?? 12,
        gstPercent: p.gstPercent ?? 5,
        handlingFee: 0,
        stock: p.stock ?? 100,
        city: "Bengaluru",
        pincode: "560001",
        photoUrl: img(p.imgKey),
        status: "Active",
      },
    });
    inserted++;
  }
  console.log(`\n✅ Products: ${inserted} new inserted, ${skipped} existing skipped`);

  // Step 4: Add a price master entry for grocery delivery (2-wheeler + 3-wheeler for grocery)
  const groceryService = await db.service.findUnique({ where: { slug: "grocery-ration" } });
  if (groceryService) {
    const existingPrice = await db.priceMaster.findFirst({
      where: { serviceId: groceryService.id, itemType: "2 Wheeler" },
    }).catch(() => null);
    if (!existingPrice) {
      // Use existing 2-wheeler vehicle if available, else null
      const twoWheeler = await db.vehicle.findFirst({ where: { name: { contains: "2" } } }).catch(() => null);
      await db.priceMaster.create({
        data: {
          serviceId: groceryService.id,
          vehicleId: twoWheeler?.id || null,
          itemType: "2 Wheeler",
          pricingType: "standard",
          minimumKm: 1,
          freeKm: 1,
          minimumFare: 20,
          perKmRate: 8,
          extraKmRate: 10,
          platformFee: 5,
          deliveryFee: 15,
          gstPercent: 5,
          commissionPercent: 8,
          status: "Active",
        },
      }).catch(() => {});
      console.log("✅ Added price master: 2 Wheeler grocery delivery");
    }
  }

  // Step 5: Verify
  const totalShops = await db.supplier.count();
  const totalProducts = await db.product.count();
  const totalServices = await db.service.count();
  const groceryProducts = await db.product.count({
    where: { supplier: { supplierType: "Grocery" } },
  });

  console.log("\n=== FINAL STATE ===");
  console.log(`Services: ${totalServices}`);
  console.log(`Total shops: ${totalShops}`);
  console.log(`Total products: ${totalProducts}`);
  console.log(`Grocery products: ${groceryProducts}`);

  // Per-shop breakdown for grocery
  const byShop = await db.product.groupBy({
    by: ["supplierId"],
    _count: { id: true },
    where: { supplier: { supplierType: "Grocery" } },
  });
  for (const s of byShop) {
    const supplier = await db.supplier.findUnique({ where: { id: s.supplierId } });
    console.log(`  Shop ${s.supplierId} (${supplier?.shopName}): ${s._count.id} products`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
