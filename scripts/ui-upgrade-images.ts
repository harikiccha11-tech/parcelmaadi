// UI UPGRADE: Update shop storefront images, service images, and add LPG Gas service
// This ONLY updates image URLs in the database - no schema changes, no API changes.
import { db } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

function loadUrlMap(): Record<string, string> {
  const candidates = [
    "/home/z/my-project/scripts/images/ui-upgrade/url_map.json",
    path.join(process.cwd(), "scripts/images/ui-upgrade/url_map.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {}
  }
  console.warn("⚠ url_map.json not found");
  return {};
}

const IMG = loadUrlMap();
console.log(`Loaded ${Object.keys(IMG).length} image URLs`);

// Fallback per category if specific image not fetched
const CATEGORY_FALLBACKS: Record<string, string> = {
  Electrical: IMG.store_electrical || IMG.cat_electrical || "https://sfile.chatglm.cn/images-ppt/3ea55c0da7c2.jpg",
  Hardware: IMG.store_hardware || IMG.cat_hardware || "https://sfile.chatglm.cn/images-ppt/2d3316213043.png",
  Fashion: IMG.store_fashion || "https://sfile.chatglm.cn/images-ppt/6051ab76cf8b.jpg",
  Mobile: IMG.store_mobile || IMG.cat_electronics || "https://sfile.chatglm.cn/images-ppt/0858ff07fe2e.jpg",
  Books: IMG.store_books || IMG.cat_stationery || "https://sfile.chatglm.cn/images-ppt/429abe75b078.jpg",
  Fancy: IMG.store_fancy || IMG.cat_flowers || "https://sfile.chatglm.cn/images-ppt/6d1b5f5677c0.jpg",
  Household: IMG.store_household || "https://sfile.chatglm.cn/images-ppt/50e25bd12b54.jpg",
  Gifts: IMG.store_gifts || IMG.cat_flowers || "https://sfile.chatglm.cn/images-ppt/6c453812e3f1.jpg",
  Grocery: IMG.store_grocery || IMG.cat_grocery || "https://sfile.chatglm.cn/images-ppt/429abe75b078.jpg",
  Material: IMG.store_material || "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg",
  Restaurant: IMG.store_restaurant || IMG.cat_restaurants || "https://sfile.chatglm.cn/images-ppt/2195cdc5ee87.jpg",
};

async function main() {
  console.log("=== UI UPGRADE: Updating shop + service images ===\n");

  // 1. Update shop storefront images based on supplierType
  const shops = await db.supplier.findMany();
  console.log(`Updating ${shops.length} shop storefront images...`);
  let updated = 0;
  for (const shop of shops) {
    const newImg = CATEGORY_FALLBACKS[shop.supplierType || ""] || shop.shopPhotoUrl;
    if (newImg && newImg !== shop.shopPhotoUrl) {
      await db.supplier.update({
        where: { id: shop.id },
        data: { shopPhotoUrl: newImg },
      });
      updated++;
      console.log(`  ✅ Shop ${shop.id} (${shop.shopName}, ${shop.supplierType}): storefront image set`);
    }
  }
  console.log(`  → ${updated} shops updated\n`);

  // 2. Update service hero images with real HD photos
  const serviceImages: Record<string, string> = {
    "parcel-delivery": IMG.svc_parcel_delivery || IMG.parcel_rider_scooter || "https://sfile.chatglm.cn/images-ppt/4756c1b968ba.jpg",
    "goods-transport": IMG.svc_goods_transport || "https://sfile.chatglm.cn/images-ppt/0fef66f4b7d2.png",
    "material-supply": IMG.svc_material_supply || "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg",
    "machinery-rental": IMG.svc_machinery_rental || "https://sfile.chatglm.cn/images-ppt/c8230f22c1ad.jpg",
    "water-supply": IMG.svc_water_supply || IMG.water_tanker_truck || "https://sfile.chatglm.cn/images-ppt/9010e7b81686.jpg",
    "borewell-drilling": IMG.svc_borewell_drilling || "https://sfile.chatglm.cn/images-ppt/0782540d55d2.jpg",
    "supplier-shop": IMG.svc_supplier_shop || IMG.store_grocery || "https://sfile.chatglm.cn/images-ppt/68f5945955e2.jpg",
    "outstation-booking": IMG.svc_outstation || "https://sfile.chatglm.cn/images-ppt/d8462d3f9a4b.jpg",
    "emergency-booking": IMG.svc_emergency || "https://sfile.chatglm.cn/images-ppt/0782540d55d2.jpg",
    "grocery-ration": IMG.svc_grocery_ration || IMG.store_grocery || "https://sfile.chatglm.cn/images-ppt/429abe75b078.jpg",
  };

  console.log("Updating service hero images...");
  let svcUpdated = 0;
  for (const [slug, url] of Object.entries(serviceImages)) {
    if (!url) continue;
    const svc = await db.service.findUnique({ where: { slug } });
    if (svc) {
      await db.service.update({ where: { id: svc.id }, data: { imageUrl: url } });
      svcUpdated++;
      console.log(`  ✅ ${slug}: ${url.slice(0, 60)}...`);
    }
  }
  console.log(`  → ${svcUpdated} services updated\n`);

  // 3. Add LPG Gas as new service (id 11)
  const lpgExisting = await db.service.findUnique({ where: { slug: "lpg-gas" } }).catch(() => null);
  if (!lpgExisting) {
    await db.service.create({
      data: {
        name: "LPG Gas Delivery",
        slug: "lpg-gas",
        description: "Domestic & commercial LPG gas cylinder delivery. HP, Bharat, Indane style cylinders. Safety-first delivery with verified executives.",
        imageUrl: IMG.svc_lpg_gas || IMG.lpg_cylinder_red || "https://sfile.chatglm.cn/images-ppt/4e2086f05be2.png",
        icon: "flame",
        status: "Active",
        sortOrder: 11,
      },
    });
    console.log("✅ Added 'LPG Gas Delivery' service\n");
  } else {
    // Update existing
    await db.service.update({
      where: { id: lpgExisting.id },
      data: { imageUrl: IMG.svc_lpg_gas || IMG.lpg_cylinder_red || lpgExisting.imageUrl },
    });
    console.log("✅ Updated existing LPG Gas service image\n");
  }

  // 4. Add LPG Gas shop + products (let DB auto-assign ID)
  const lpgShop = await db.supplier.findFirst({ where: { supplierType: "LPG Gas" } }).catch(() => null);
  let lpgShopId: number;
  if (!lpgShop) {
    const newShop = await db.supplier.create({
      data: {
        supplierName: "GasDirect Supply Co.",
        shopName: "GasDirect - LPG Cylinder Delivery",
        supplierType: "LPG Gas",
        address: "Industrial Area, Bengaluru 560058",
        mobile: "9845099999",
        whatsapp: "919845099999",
        flatDeliveryFee: 50,
        status: "Approved",
        shopPhotoUrl: IMG.lpg_cylinder_red || IMG.store_material,
      },
    });
    lpgShopId = newShop.id;
    console.log(`✅ Created LPG shop: ${newShop.shopName} (id: ${lpgShopId})`);
  } else {
    lpgShopId = lpgShop.id;
    console.log(`⏭️  LPG shop already exists: ${lpgShop.shopName}`);
  }

  // LPG Products
  const lpgProducts = [
    { name: "Domestic LPG Cylinder 14.2kg (Red)", brand: "HP Gas Style", unit: "Cylinder", mrp: 1100, sp: 1050, stock: 50, img: IMG.lpg_cylinder_red },
    { name: "Domestic LPG Cylinder 14.2kg (Blue)", brand: "Bharat Gas Style", unit: "Cylinder", mrp: 1100, sp: 1050, stock: 50, img: IMG.lpg_cylinder_blue },
    { name: "Commercial LPG Cylinder 19kg (Orange)", brand: "Indane Style", unit: "Cylinder", mrp: 1800, sp: 1750, stock: 30, img: IMG.lpg_cylinder_orange },
    { name: "Commercial LPG Cylinder 47.5kg (Bulk)", brand: "Industrial", unit: "Cylinder", mrp: 4200, sp: 4100, stock: 15, img: IMG.lpg_cylinder_red },
    { name: "LPG Cylinder Refill (Domestic)", brand: "Any Brand", unit: "Refill", mrp: 1100, sp: 1050, stock: 100, img: IMG.lpg_cylinder_red },
    { name: "LPG Cylinder Refill (Commercial 19kg)", brand: "Any Brand", unit: "Refill", mrp: 1800, sp: 1750, stock: 40, img: IMG.lpg_cylinder_orange },
    { name: "LPG Gas Stove 2 Burner", brand: "Premium", unit: "Piece", mrp: 2200, sp: 1999, stock: 20, img: IMG.lpg_kitchen_stove },
    { name: "LPG Gas Regulator + Hose Pipe Kit", brand: "Safe Gas", unit: "Set", mrp: 850, sp: 750, stock: 60, img: IMG.lpg_safety_gear },
  ];

  for (const p of lpgProducts) {
    const existing = await db.product.findFirst({
      where: { supplierId: lpgShopId, productName: p.name },
    }).catch(() => null);
    if (existing) continue;
    await db.product.create({
      data: {
        supplierId: lpgShopId,
        category: "LPG Gas",
        productName: p.name,
        brand: p.brand,
        unit: p.unit,
        mrp: p.mrp,
        marketLowPrice: p.sp,
        marketHighPrice: p.mrp,
        supplierPrice: p.sp - 50,
        sellingPrice: p.sp,
        marginPercent: 5,
        gstPercent: 18,
        stock: p.stock,
        city: "Bengaluru",
        pincode: "560058",
        photoUrl: p.img || IMG.lpg_cylinder_red,
        status: "Active",
      },
    });
  }
  console.log(`✅ Created ${lpgProducts.length} LPG products\n`);

  // 5. Add LPG delivery price master (scooter + 3-wheeler)
  const lpgService = await db.service.findUnique({ where: { slug: "lpg-gas" } });
  if (lpgService) {
    const existingPrice = await db.priceMaster.findFirst({
      where: { serviceId: lpgService.id, itemType: "2 Wheeler" },
    }).catch(() => null);
    if (!existingPrice) {
      const twoWheeler = await db.vehicle.findFirst({ where: { name: { contains: "2" } } }).catch(() => null);
      await db.priceMaster.create({
        data: {
          serviceId: lpgService.id,
          vehicleId: twoWheeler?.id || null,
          itemType: "2 Wheeler",
          pricingType: "standard",
          minimumKm: 2,
          freeKm: 2,
          minimumFare: 30,
          perKmRate: 10,
          extraKmRate: 12,
          platformFee: 5,
          deliveryFee: 20,
          gstPercent: 5,
          commissionPercent: 8,
          status: "Active",
        },
      }).catch(() => {});
      console.log("✅ Added LPG Gas price master (2 Wheeler)");
    }
  }

  // 6. Final stats
  const totalShops = await db.supplier.count();
  const totalProducts = await db.product.count();
  const totalServices = await db.service.count();
  console.log("\n=== FINAL STATE ===");
  console.log(`Services: ${totalServices}`);
  console.log(`Shops: ${totalShops}`);
  console.log(`Products: ${totalProducts}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
