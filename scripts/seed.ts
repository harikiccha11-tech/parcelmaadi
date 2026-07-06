// ParcelMaadi seed script v2 — 8 services, 13 vehicles, 10 materials, 8 machinery, 7 water
// + Porter-match discount bands, multi-admin users, serviceable areas, policy content.
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const IMG = {
  services: {
    "parcel-delivery": "https://sfile.chatglm.cn/images-ppt/4e2086f05be2.png",
    "goods-transport": "https://sfile.chatglm.cn/images-ppt/72163a18223b.jpg",
    "material-supply": "https://sfile.chatglm.cn/images-ppt/4109ef7bace8.jpg",
    "machinery-rental": "https://sfile.chatglm.cn/images-ppt/70f0b1b629e7.jpg",
    "water-supply": "https://sfile.chatglm.cn/images-ppt/9010e7b81686.jpg",
    "supplier-shop": "https://sfile.chatglm.cn/images-ppt/68f5945955e2.jpg",
    "outstation-booking": "https://sfile.chatglm.cn/images-ppt/d8462d3f9a4b.jpg",
    "emergency-booking": "https://sfile.chatglm.cn/images-ppt/0782540d55d2.jpg",
  },
  vehicles: {
    "2-wheeler": "https://sfile.chatglm.cn/images-ppt/4756c1b968ba.jpg",
    "scooter": "https://sfile.chatglm.cn/images-ppt/e13506635f3f.jpg",
    "e-loader": "https://sfile.chatglm.cn/images-ppt/8588cfbb8ab4.png",
    "mini-3w": "https://sfile.chatglm.cn/images-ppt/81cfaf196dcc.png",
    "3-wheeler": "https://sfile.chatglm.cn/images-ppt/81cfaf196dcc.png",
    "tata-ace": "https://sfile.chatglm.cn/images-ppt/f5c88233459a.jpg",
    "pickup-8ft": "https://sfile.chatglm.cn/images-ppt/0fef66f4b7d2.png",
    "pickup-9ft": "https://sfile.chatglm.cn/images-ppt/960607f52cf6.jpg",
    "407": "https://sfile.chatglm.cn/images-ppt/e9f6421df345.jpg",
    "14ft": "https://sfile.chatglm.cn/images-ppt/e6651b95c5fa.jpg",
    "17ft": "https://sfile.chatglm.cn/images-ppt/1497540e47c9.jpg",
    "19ft": "https://sfile.chatglm.cn/images-ppt/b00530c5e2c5.jpg",
    "20ft": "https://sfile.chatglm.cn/images-ppt/a46d248b9107.jpg",
    "32ft": "https://sfile.chatglm.cn/images-ppt/b1b11d115ed1.jpg",
  },
  materials: {
    "sand": "https://sfile.chatglm.cn/images-ppt/1b5dc2ac5b27.jpeg",
    "m-sand": "https://sfile.chatglm.cn/images-ppt/cedb12a8b077.jpg",
    "cement": "https://sfile.chatglm.cn/images-ppt/5126d6423350.jpg",
    "steel": "https://sfile.chatglm.cn/images-ppt/0a18dbdd62f0.jpg",
    "bricks": "https://sfile.chatglm.cn/images-ppt/500619644178.jpg",
    "blocks": "https://sfile.chatglm.cn/images-ppt/42e1fa3826fa.png",
    "jelly": "https://sfile.chatglm.cn/images-ppt/2d3316213043.png",
    "stone": "https://sfile.chatglm.cn/images-ppt/16d230ccc5c2.png",
    "soil": "https://sfile.chatglm.cn/images-ppt/0e118cb75e13.jpg",
    "other-materials": "https://sfile.chatglm.cn/images-ppt/1aa9783a0537.jpg",
  },
  machinery: {
    "jcb": "https://sfile.chatglm.cn/images-ppt/c8230f22c1ad.jpg",
    "excavator": "https://sfile.chatglm.cn/images-ppt/81f1577ff457.jpg",
    "tractor": "https://sfile.chatglm.cn/images-ppt/b9e19a813472.jpg",
    "hydra": "https://sfile.chatglm.cn/images-ppt/9e149f9d5a69.jpg",
    "forklift": "https://sfile.chatglm.cn/images-ppt/9d41eff14ca2.jpg",
    "concrete-mixer": "https://sfile.chatglm.cn/images-ppt/a13102e69643.jpg",
    "crane": "https://sfile.chatglm.cn/images-ppt/fe70bd6624a0.png",
    "other-machinery": "https://sfile.chatglm.cn/images-ppt/2d24e96fd114.jpg",
  },
  water: {
    "2kl": "https://sfile.chatglm.cn/images-ppt/05c8a74fbb6f.png",
    "4kl": "https://sfile.chatglm.cn/images-ppt/9010e7b81686.jpg",
    "6kl": "https://sfile.chatglm.cn/images-ppt/26c5412b437f.jpeg",
    "12kl": "https://sfile.chatglm.cn/images-ppt/c594351da657.jpg",
    "drinking-water": "https://sfile.chatglm.cn/images-ppt/b8744bf1cb92.jpg",
    "borewell-water": "https://sfile.chatglm.cn/images-ppt/d8418016dda5.jpg",
    "construction-water": "https://sfile.chatglm.cn/images-ppt/3f97a9933f6b.jpg",
  },
};

async function main() {
  console.log("Seeding ParcelMaadi database v2...");

  // ---- Wipe existing master data (bookings cleared for clean re-seed) ----
  console.log("Clearing old master data...");
  await db.statusHistory.deleteMany();
  await db.payment.deleteMany();
  await db.booking.deleteMany();
  await db.customer.deleteMany();
  await db.priceMaster.deleteMany();
  await db.vehicle.deleteMany();
  await db.service.deleteMany();
  await db.supplier.deleteMany();
  await db.zone.deleteMany();
  await db.coupon.deleteMany();

  // ---- Admin users (multiple roles) ----
  const admins = [
    { name: "HP Enterprise Owner", email: "admin@parcelmaadi.com", mobile: "9741433725", role: "Owner" },
    { name: "Operations Admin", email: "ops@parcelmaadi.com", mobile: "9538110059", role: "Operations" },
    { name: "Accounts Admin", email: "accounts@parcelmaadi.com", mobile: "9741433725", role: "Accounts" },
    { name: "View Only Admin", email: "view@parcelmaadi.com", mobile: "9741433725", role: "View" },
  ];
  for (const a of admins) {
    const existing = await db.adminUser.findUnique({ where: { email: a.email } });
    if (!existing) {
      // First-time setup: owner must set their own password on first login (forcePasswordChange=true)
      await db.adminUser.create({ data: { ...a, passwordHash: hashPassword("admin123"), status: "Active", forcePasswordChange: true } });
    } else {
      // Reset password to temp + force change on every re-seed (dev convenience; remove in production)
      await db.adminUser.update({ where: { email: a.email }, data: { name: a.name, mobile: a.mobile, role: a.role, passwordHash: hashPassword("admin123"), forcePasswordChange: true } });
    }
  }
  console.log("✓ Admin users (Owner/Operations/Accounts/View) — first-time password change forced (temp: admin123)");

  // ---- Zones ----
  const zones = [
    { name: "Bengaluru Central", slug: "bengaluru-central", cities: "Bengaluru,Bangalore,MG Road,Indiranagar,Koramangala", pinCodes: "560001,560008,560034,560038,560047,560095" },
    { name: "Bengaluru North", slug: "bengaluru-north", cities: "Yelahanka,Hebbal,Thanisandra", pinCodes: "560064,560092,560077" },
    { name: "Bengaluru South", slug: "bengaluru-south", cities: "JP Nagar,Banashankari,Jayanagar", pinCodes: "560078,560070,560041" },
    { name: "Bengaluru West", slug: "bengaluru-west", cities: "Rajajinagar,Vijayanagar,Basaveshwaranagar", pinCodes: "560010,560040,560079" },
    { name: "Mysuru", slug: "mysuru", cities: "Mysuru,Mysore", pinCodes: "570001,570002,570008" },
    { name: "Other Karnataka", slug: "other-karnataka", cities: "Mangaluru,Hubli,Belagavi,Davanagere,Shimoga,Tumakur,Hosadurga,Chitradurga", pinCodes: "575001,580001,590001,577515" },
  ];
  for (const z of zones) {
    await db.zone.upsert({ where: { slug: z.slug }, update: {}, create: z });
  }
  console.log(`✓ ${zones.length} zones`);

  // ---- Coupons ----
  const coupons = [
    { code: "FIRST50", description: "₹50 off on first booking", discountType: "flat", discountValue: 50, minOrderAmount: 200, maxDiscount: 50, usageLimit: 100, status: "Active" },
    { code: "PARCEL10", description: "10% off parcel delivery", discountType: "percent", discountValue: 10, minOrderAmount: 100, maxDiscount: 100, usageLimit: 200, status: "Active" },
    { code: "WEEKEND5", description: "5% off weekend bookings", discountType: "percent", discountValue: 5, minOrderAmount: 300, maxDiscount: 150, usageLimit: 500, status: "Active" },
  ];
  for (const c of coupons) {
    const existing = await db.coupon.findUnique({ where: { code: c.code } });
    if (!existing) await db.coupon.create({ data: c });
  }
  console.log(`✓ ${coupons.length} coupons`);

  // ---- Settings (brand + future-tool toggles + Porter-match) ----
  const settingsSeed: { key: string; value: string; type: string }[] = [
    { key: "company_name", value: "HP Enterprise", type: "text" },
    { key: "brand_name", value: "ParcelMaadi", type: "text" },
    { key: "tagline", value: "Fast Local Reliable", type: "text" },
    { key: "primary_color", value: "#FACC15", type: "color" },
    { key: "secondary_color", value: "#DC2626", type: "color" },
    { key: "accent_color", value: "#EAB308", type: "color" },
    { key: "dark_color", value: "#111827", type: "color" },
    { key: "contact_1", value: "9741433725", type: "text" },
    { key: "contact_2", value: "8073748271", type: "text" },
    { key: "ceo_name", value: "Hareesh T", type: "text" },
    { key: "ceo_mobile", value: "9741433725", type: "text" },
    { key: "md_name", value: "HariPrasad N P", type: "text" },
    { key: "md_mobile", value: "8073748271", type: "text" },
    { key: "email", value: "parcelmaadipm@gmail.com", type: "text" },
    { key: "gstin", value: "29ANZPH4067Q1ZS", type: "text" },
    { key: "company_address", value: "HP ENTERPRISE, Venkateshwara Nilaya, behind Hanuman Mandir, Nagenahalli, Hosadurga, Chitradurga, Karnataka 577515", type: "text" },
    { key: "website", value: "parcelmaadi.com", type: "text" },
    { key: "upi_id", value: "9538110059@ybl", type: "text" },
    { key: "announcement", value: "Book parcel & goods delivery in 2 minutes — Fast Local Reliable!", type: "text" },
    { key: "whatsapp_number", value: "919741433725", type: "text" },
    // Password reset (recovery email stored ONLY in settings/DB, never exposed in UI/code)
    { key: "password_recovery_email", value: "hariprasadnp11@gmail.com", type: "secret" },
    { key: "password_reset_link_expiry_minutes", value: "20", type: "number" },
    { key: "password_reset_rate_limit_per_hour", value: "3", type: "number" },
    // Night-charge window (IST hours, 24h format)
    { key: "night_charge_start_hour", value: "22", type: "number" },
    { key: "night_charge_end_hour", value: "5", type: "number" },
    { key: "night_charge_auto_apply", value: "true", type: "bool" },
    // Timezone
    { key: "timezone", value: "Asia/Kolkata", type: "text" },
    // Payment toggles
    { key: "payment_pay_advance", value: "true", type: "bool" },
    { key: "payment_pay_full", value: "true", type: "bool" },
    { key: "payment_pay_later", value: "true", type: "bool" },
    { key: "payment_advance_percent", value: "25", type: "number" },
    // Porter-match
    { key: "porter_match_enabled", value: "true", type: "bool" },
    { key: "porter_match_bands", value: JSON.stringify([
      { from: 0, to: 100, percent: 0 },
      { from: 100, to: 500, percent: 2 },
      { from: 500, to: 1500, percent: 3 },
      { from: 1500, to: 3000, percent: 3 },
      { from: 3000, to: 5000, percent: 4 },
      { from: 5000, to: null, percent: 5 },
    ]), type: "json" },
    { key: "porter_min_commission_floor", value: "20", type: "number" },
    // Future-tool toggles (all ON/OFF with API key placeholders)
    { key: "tool_google_maps", value: "false", type: "bool" },
    { key: "tool_google_maps_key", value: "", type: "secret" },
    { key: "tool_whatsapp_api", value: "false", type: "bool" },
    { key: "tool_whatsapp_api_key", value: "", type: "secret" },
    { key: "tool_sms_otp", value: "false", type: "bool" },
    { key: "tool_sms_api_key", value: "", type: "secret" },
    { key: "tool_payment_gateway", value: "false", type: "bool" },
    { key: "tool_payment_provider", value: "razorpay", type: "text" },
    { key: "tool_payment_key_id", value: "", type: "secret" },
    { key: "tool_payment_key_secret", value: "", type: "secret" },
    { key: "tool_email", value: "false", type: "bool" },
    { key: "tool_email_smtp", value: "", type: "secret" },
    { key: "tool_pdf_quotation", value: "true", type: "bool" },
    { key: "tool_gst_invoice", value: "true", type: "bool" },
    { key: "tool_customer_login", value: "false", type: "bool" },
    { key: "tool_partner_rider", value: "false", type: "bool" },
    { key: "tool_supplier", value: "false", type: "bool" },
    { key: "tool_live_tracking", value: "false", type: "bool" },
    { key: "tool_promo_code", value: "false", type: "bool" },
    { key: "tool_wallet_credit", value: "false", type: "bool" },
    { key: "tool_ratings", value: "false", type: "bool" },
    { key: "tool_multi_language", value: "false", type: "bool" },
    { key: "tool_ntfy", value: "true", type: "bool" },
    { key: "ntfy_topic", value: "parcelmaadi-admin-x7k9m2", type: "text" },
    { key: "ntfy_server", value: "https://ntfy.sh", type: "text" },
    { key: "tool_telegram", value: "false", type: "bool" },
    { key: "telegram_bot_token", value: "", type: "secret" },
    { key: "telegram_chat_id", value: "", type: "text" },
    // Security
    { key: "session_timeout_minutes", value: "60", type: "number" },
    { key: "rate_limit_booking_per_minute", value: "3", type: "number" },
    { key: "rate_limit_login_per_minute", value: "5", type: "number" },
    { key: "upload_max_size_mb", value: "5", type: "number" },
    // Serviceable areas (Karnataka-first)
    { key: "serviceable_areas", value: JSON.stringify([
      "Bengaluru","Bangalore","Bengaluru Urban","Bengaluru Rural","Mysuru","Mysore","Mangaluru","Mangalore",
      "Hubli","Hubballi","Belagavi","Belgaum","Davanagere","Ballari","Bellary","Gulbarga","Kalaburagi",
      "Dharwad","Shimoga","Shivamogga","Tumakur","Tumkur","Udupi","Hassan","Mandya","Chikmagalur",
      "Vijayanagara","Hospet","Raichur","Bidar","Karnataka","560","562","570","571","572","573","574","575","576","577","577","578","579","581","582","583","584","585","586","587","588","589","591","591","592","593","594","595","596","597","598",
    ]), type: "json" },
    // Trust section
    { key: "trust_clients", value: JSON.stringify(["Local Retailers","Construction Firms","Event Planners","Residential Societies"]), type: "json" },
    { key: "trust_testimonials", value: JSON.stringify([
      { name: "Ramesh K.", text: "Booked a Tata Ace for shifting. Fast and affordable!" },
      { name: "Sunita M.", text: "Water tanker delivered in 30 minutes. Highly recommend." },
      { name: "Imran S.", text: "Best parcel service in Bangalore for my shop." },
    ]), type: "json" },
    { key: "trust_coverage", value: "Bengaluru · Mysuru · Mangaluru · Hubli · Belagavi · and 20+ Karnataka cities", type: "text" },
  ];
  for (const s of settingsSeed) {
    await db.settings.upsert({ where: { key: s.key }, update: { value: s.value, type: s.type }, create: s });
  }
  console.log("✓ Settings (brand + future tools + Porter-match + serviceable areas)");

  // ---- Domain settings ----
  await db.domainSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      customerUrl: "",
      adminUrl: "",
      apiBaseUrl: "/api",
      canonicalUrl: "",
      whatsappBookingUrl: "https://wa.me/919741433725",
      logoUrl: "/logo.png",
      seoTitle: "ParcelMaadi — Fast Local Reliable Parcel & Goods Delivery",
      seoDescription: "Book parcel delivery, goods vehicles, water tankers, construction material and machinery rental in minutes. By HP Enterprise. Fast Local Reliable.",
    },
  });
  console.log("✓ Domain settings (relative URLs only)");

  // ---- Content sections (incl. policy pages) ----
  const contentSeed = [
    { sectionKey: "hero", title: "Fast Local Reliable Parcel & Goods Delivery", subtitle: "Book in 2 minutes", body: "Parcel delivery, goods vehicles, water tankers, construction material, machinery rental and packed ration — all from one app.", sortOrder: 1 },
    { sectionKey: "how_it_works", title: "How It Works", subtitle: "Book in 3 simple steps", body: "1. Choose your service and vehicle.\n2. Set pickup & drop on the map.\n3. Confirm fare and book instantly.", sortOrder: 2 },
    { sectionKey: "about", title: "About ParcelMaadi", subtitle: "By HP Enterprise", body: "ParcelMaadi by HP Enterprise is your local partner for parcel, courier, goods vehicles, water tankers and construction material. We connect customers with reliable drivers and suppliers across Karnataka.", sortOrder: 3 },
    { sectionKey: "faq", title: "Frequently Asked Questions", subtitle: "", body: "Q: Do you provide rider app? A: Not yet. Admin assigns drivers manually.\nQ: How is fare calculated? A: From our live price master — base fare + distance + loading + GST, with Porter-match discount.\nQ: Can I pay later? A: Yes, Pay Later, Advance or Full UPI options available.", sortOrder: 4 },
    { sectionKey: "terms", title: "Terms & Conditions", subtitle: "HP Enterprise", body: "1. By booking with ParcelMaadi (operated by HP Enterprise, GSTIN 29ANZPH4067Q1ZS) you agree to these terms.\n2. Fares shown are estimates; the final amount may vary based on actual distance, waiting time and additional services confirmed by the admin.\n3. The customer is responsible for accurate pickup/drop locations and item details.\n4. ParcelMaadi assigns drivers/suppliers manually; no auto-assignment or live tracking is provided at this time.\n5. Payments must be made through approved methods (UPI/cash/advance) as selected at booking.\n6. HP Enterprise reserves the right to refuse or cancel any booking that violates these terms.\n7. Disputes are subject to Bangalore jurisdiction.", sortOrder: 5 },
    { sectionKey: "privacy", title: "Privacy Policy", subtitle: "HP Enterprise", body: "1. ParcelMaadi (HP Enterprise) collects only the information needed to fulfil your booking — name, mobile, pickup and drop locations, and item details.\n2. We never sell your personal data to third parties.\n3. Location data is used solely for booking fulfilment and is stored securely.\n4. Payment screenshots are stored to verify transactions and for accounting.\n5. You may request deletion of your data by emailing parcelmaadipm@gmail.com.\n6. We use cookies/localStorage only to improve your booking experience.", sortOrder: 6 },
    { sectionKey: "refund", title: "Refund & Cancellation Policy", subtitle: "HP Enterprise", body: "1. You can cancel a booking free of charge before the admin confirms it.\n2. Advance payments are fully refundable if cancelled before driver/supplier assignment.\n3. After pickup, refunds are assessed case-by-case and processed within 7 working days.\n4. If ParcelMaadi cancels a booking, any advance paid is refunded in full.\n5. No refund is provided once the service is marked 'Completed' unless there is a verified service failure.\n6. Refunds are credited back to the original payment method or via UPI within 7 working days.\n7. To request a refund, email parcelmaadipm@gmail.com with your Order ID.", sortOrder: 7 },
    { sectionKey: "trust", title: "Trusted by Local Businesses", subtitle: "", body: "Hundreds of retailers, builders and families across Karnataka trust ParcelMaadi for fast, reliable and affordable logistics.", sortOrder: 8 },
  ];
  for (const c of contentSeed) {
    await db.contentSection.upsert({ where: { sectionKey: c.sectionKey }, update: {}, create: c });
  }
  console.log("✓ Content sections (incl. Terms/Privacy/Refund policies)");

  // ---- Services (8) ----
  const servicesSeed = [
    { name: "Parcel Delivery", slug: "parcel-delivery", icon: "Package", description: "Send small parcels & documents by 2-wheeler or scooter. Fast and affordable.", imageUrl: "https://sfile.chatglm.cn/images-ppt/b08e6e74fb85.jpg", sortOrder: 1 },
    { name: "Goods Transport", slug: "goods-transport", icon: "Truck", description: "3-wheeler to 32ft trucks for moving goods of any size across the city.", imageUrl: IMG.services["goods-transport"], sortOrder: 2 },
    { name: "Material Supply", slug: "material-supply", icon: "HardHat", description: "Sand, cement, steel, bricks, jelly, blocks delivered to your site.", imageUrl: IMG.services["material-supply"], sortOrder: 3 },
    { name: "Machinery Rental", slug: "machinery-rental", icon: "Wrench", description: "JCB, excavator, tractor, hydra, forklift, mixer and crane on rent.", imageUrl: IMG.services["machinery-rental"], sortOrder: 4 },
    { name: "Water Supply", slug: "water-supply", icon: "Droplets", description: "2KL to 12KL water tankers, 20L water cans — drinking, borewell or construction.", imageUrl: IMG.services["water-supply"], sortOrder: 5 },
    { name: "Borewell Drilling", slug: "borewell-drilling", icon: "Droplets", description: "Borewell drilling rigs 4″/6″/8″ + flushing. Per-foot pricing. Book directly.", imageUrl: "https://sfile.chatglm.cn/images-ppt/99526e6cecef.jpg", sortOrder: 6 },
    { name: "Supplier / Shop", slug: "supplier-shop", icon: "ShoppingCart", description: "Packed ration & grocery from verified suppliers and shops.", imageUrl: IMG.services["supplier-shop"], sortOrder: 7 },
    { name: "Outstation Booking", slug: "outstation-booking", icon: "Truck", description: "Long-distance goods movement across Karnataka & beyond.", imageUrl: IMG.services["outstation-booking"], sortOrder: 8 },
    { name: "Emergency Booking", slug: "emergency-booking", icon: "Siren", description: "Urgent need? Book now and admin will confirm price manually.", imageUrl: IMG.services["emergency-booking"], sortOrder: 9 },
  ];
  const svcMap: Record<string, number> = {};
  for (const s of servicesSeed) {
    const svc = await db.service.create({ data: { ...s, status: "Active" } });
    svcMap[s.slug] = svc.id;
  }
  console.log("✓ 8 services with realistic images");

  // ---- Vehicle definitions (13 canonical) ----
  interface VDef { slug: string; name: string; maxLoad: string; recommendedUse: string; imageUrl: string; }
  const vehicleDefs: VDef[] = [
    { slug: "2-wheeler", name: "2 Wheeler", maxLoad: "20 kg", recommendedUse: "Small parcels & documents within city", imageUrl: IMG.vehicles["2-wheeler"] },
    { slug: "scooter", name: "Scooter", maxLoad: "20 kg", recommendedUse: "Small parcel/box tier above 2-wheeler", imageUrl: IMG.vehicles["scooter"] },
    { slug: "e-loader", name: "E-Loader", maxLoad: "300 kg", recommendedUse: "Light electric 3-wheeler for eco-friendly small loads", imageUrl: IMG.vehicles["e-loader"] },
    { slug: "mini-3w", name: "Mini 3W", maxLoad: "400 kg", recommendedUse: "Compact mini 3-wheeler for small loads & tight streets", imageUrl: IMG.vehicles["mini-3w"] },
    { slug: "3-wheeler", name: "3 Wheeler Cargo", maxLoad: "500 kg", recommendedUse: "Light goods, multi-drop, compact loads", imageUrl: IMG.vehicles["3-wheeler"] },
    { slug: "tata-ace", name: "Tata Ace", maxLoad: "1 ton", recommendedUse: "House shifting, small goods, intra-city", imageUrl: IMG.vehicles["tata-ace"] },
    { slug: "pickup-8ft", name: "Pickup 8ft", maxLoad: "1.2 ton", recommendedUse: "Medium goods, appliance & furniture moves", imageUrl: IMG.vehicles["pickup-8ft"] },
    { slug: "pickup-9ft", name: "Pickup 9ft", maxLoad: "1.5 ton", recommendedUse: "Larger household & commercial goods", imageUrl: IMG.vehicles["pickup-9ft"] },
    { slug: "407", name: "407", maxLoad: "2.5 ton", recommendedUse: "Heavy goods, bulk intra-city & nearby outstation", imageUrl: IMG.vehicles["407"] },
    { slug: "14ft", name: "14 ft Truck", maxLoad: "4 ton", recommendedUse: "Bulk transport, light outstation", imageUrl: IMG.vehicles["14ft"] },
    { slug: "17ft", name: "17 ft Truck", maxLoad: "6 ton", recommendedUse: "Large consignments, outstation", imageUrl: IMG.vehicles["17ft"] },
    { slug: "19ft", name: "19 ft Truck", maxLoad: "7 ton", recommendedUse: "Heavy outstation loads", imageUrl: IMG.vehicles["19ft"] },
    { slug: "20ft", name: "20 ft Truck", maxLoad: "9 ton", recommendedUse: "Industrial & large outstation consignments", imageUrl: IMG.vehicles["20ft"] },
    { slug: "32ft", name: "32 ft Truck", maxLoad: "20 ton", recommendedUse: "Heavy industrial & long-haul outstation", imageUrl: IMG.vehicles["32ft"] },
  ];

  // ---- Price master rows (13 vehicles per the final merged CSV) ----
  interface PRow { serviceSlug: string; vehicleSlug: string; itemType: string; minFare: number; minKm: number; slabs: string; perKm: number; loading: number; waiting: number; commission: number; advance: number; notes: string; pricingType?: string; unitType?: string; perUnitRate?: number; roundTripMultiplier?: number; rushSurchargePercent?: number; supplierId?: number; flatDeliveryFee?: number; }
  const priceRows: PRow[] = [
    { serviceSlug: "parcel-delivery", vehicleSlug: "2-wheeler", itemType: "2 Wheeler", minFare: 80, minKm: 3, slabs: "4-10 km: 12 per km, 11-25 km: 10 per km, 26+ km: 9 per km", perKm: 0, loading: 0, waiting: 0, commission: 20, advance: 0, notes: "Renamed from Bike Parcel. Waiting ₹2/min after 10 min" },
    { serviceSlug: "parcel-delivery", vehicleSlug: "scooter", itemType: "Scooter", minFare: 90, minKm: 3, slabs: "4-10 km: 13 per km, 11-25 km: 11 per km, 26+ km: 10 per km", perKm: 0, loading: 0, waiting: 0, commission: 20, advance: 0, notes: "Small parcel/box tier above 2 Wheeler" },
    { serviceSlug: "goods-transport", vehicleSlug: "e-loader", itemType: "E-Loader", minFare: 250, minKm: 4, slabs: "5-15 km: 22 per km, 16-40 km: 19 per km, 41+ km: 17 per km", perKm: 0, loading: 150, waiting: 0, commission: 18, advance: 0, notes: "Light electric 3-wheeler. Waiting ₹3/min after 15 min" },
    { serviceSlug: "goods-transport", vehicleSlug: "mini-3w", itemType: "Mini 3W", minFare: 300, minKm: 4, slabs: "5-15 km: 25 per km, 16-40 km: 22 per km, 41+ km: 19 per km", perKm: 0, loading: 200, waiting: 0, commission: 18, advance: 0, notes: "Compact mini 3-wheeler for tight streets. Waiting ₹4/min after 15 min" },
    { serviceSlug: "goods-transport", vehicleSlug: "3-wheeler", itemType: "3 Wheeler Cargo", minFare: 350, minKm: 5, slabs: "6-15 km: 28 per km, 16-50 km: 25 per km, 51+ km: 22 per km", perKm: 0, loading: 300, waiting: 0, commission: 18, advance: 0, notes: "Waiting ₹5/min after 20 min" },
    { serviceSlug: "goods-transport", vehicleSlug: "tata-ace", itemType: "Tata Ace", minFare: 800, minKm: 10, slabs: "11-25 km: 35 per km, 26-100 km: 32 per km, 101+ km: 28 per km", perKm: 0, loading: 500, waiting: 0, commission: 18, advance: 0, notes: "Waiting ₹200/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "pickup-8ft", itemType: "Pickup 8ft", minFare: 1000, minKm: 10, slabs: "11-25 km: 40 per km, 26-100 km: 36 per km, 101+ km: 32 per km", perKm: 0, loading: 600, waiting: 0, commission: 16, advance: 0, notes: "Between Tata Ace and Pickup 9ft. Waiting ₹220/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "pickup-9ft", itemType: "Pickup 9ft", minFare: 1200, minKm: 10, slabs: "11-25 km: 45 per km, 26-100 km: 40 per km, 101+ km: 36 per km", perKm: 0, loading: 700, waiting: 0, commission: 15, advance: 0, notes: "Renamed from Bolero Pickup. Waiting ₹250/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "407", itemType: "407", minFare: 1900, minKm: 15, slabs: "16-50 km: 55 per km, 51-150 km: 50 per km, 151+ km: 45 per km", perKm: 0, loading: 850, waiting: 0, commission: 13, advance: 0, notes: "Between Pickup 9ft and 14ft. Waiting ₹300/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "14ft", itemType: "14 ft Truck", minFare: 3000, minKm: 20, slabs: "21-50 km: 65 per km, 51-150 km: 60 per km, 151+ km: 55 per km", perKm: 0, loading: 1000, waiting: 0, commission: 12, advance: 0, notes: "Waiting ₹350/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "17ft", itemType: "17 ft Truck", minFare: 4500, minKm: 30, slabs: "31-75 km: 85 per km, 76-200 km: 80 per km, 201+ km: 72 per km", perKm: 0, loading: 1200, waiting: 0, commission: 12, advance: 0, notes: "Waiting ₹400/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "19ft", itemType: "19 ft Truck", minFare: 5500, minKm: 35, slabs: "36-100 km: 97 per km, 101-250 km: 90 per km, 251+ km: 80 per km", perKm: 0, loading: 1350, waiting: 0, commission: 11, advance: 0, notes: "Between 17ft and 20ft. Waiting ₹450/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "20ft", itemType: "20 ft Truck", minFare: 6500, minKm: 40, slabs: "41-100 km: 110 per km, 101-250 km: 100 per km, 251+ km: 90 per km", perKm: 0, loading: 1500, waiting: 0, commission: 10, advance: 0, notes: "Waiting ₹500/hour" },
    { serviceSlug: "goods-transport", vehicleSlug: "32ft", itemType: "32 ft Truck", minFare: 10000, minKm: 50, slabs: "51-150 km: 150 per km, 151-300 km: 140 per km, 301+ km: 125 per km", perKm: 0, loading: 2000, waiting: 0, commission: 10, advance: 0, notes: "Waiting ₹700/hour" },
    // Water tankers
    { serviceSlug: "water-supply", vehicleSlug: "2kl", itemType: "2KL Water Tanker", minFare: 600, minKm: 5, slabs: "After 5 km: 25 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "Drinking, borewell, construction" },
    { serviceSlug: "water-supply", vehicleSlug: "4kl", itemType: "4KL Water Tanker", minFare: 900, minKm: 5, slabs: "After 5 km: 30 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "" },
    { serviceSlug: "water-supply", vehicleSlug: "6kl", itemType: "6KL Water Tanker", minFare: 1200, minKm: 5, slabs: "After 5 km: 35 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "" },
    { serviceSlug: "water-supply", vehicleSlug: "12kl", itemType: "12KL Water Tanker", minFare: 2200, minKm: 5, slabs: "After 5 km: 50 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "" },
    { serviceSlug: "water-supply", vehicleSlug: "drinking-water", itemType: "Drinking Water", minFare: 700, minKm: 5, slabs: "After 5 km: 28 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "Potable drinking water supply" },
    { serviceSlug: "water-supply", vehicleSlug: "borewell-water", itemType: "Borewell Water", minFare: 550, minKm: 5, slabs: "After 5 km: 22 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "Borewell water for non-drinking use" },
    { serviceSlug: "water-supply", vehicleSlug: "construction-water", itemType: "Construction Water", minFare: 650, minKm: 5, slabs: "After 5 km: 26 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "Water for construction sites" },
  ];

  // Also add materials, machinery, water, supplier, outstation, emergency as vehicles-with-prices
  const materialDefs: VDef[] = [
    { slug: "sand", name: "Sand (River)", maxLoad: "Ton Load", recommendedUse: "River sand for construction", imageUrl: IMG.materials["sand"] },
    { slug: "m-sand", name: "M-Sand", maxLoad: "Ton Load", recommendedUse: "Manufactured sand, eco-friendly", imageUrl: IMG.materials["m-sand"] },
    { slug: "cement", name: "Cement", maxLoad: "Bag", recommendedUse: "OPC 53 grade cement bags", imageUrl: IMG.materials["cement"] },
    { slug: "steel", name: "Steel", maxLoad: "Kg/Ton", recommendedUse: "TMT steel bars", imageUrl: IMG.materials["steel"] },
    { slug: "bricks", name: "Bricks", maxLoad: "Piece Load", recommendedUse: "Red clay bricks", imageUrl: IMG.materials["bricks"] },
    { slug: "blocks", name: "Blocks", maxLoad: "Piece Load", recommendedUse: "Concrete/Solid blocks", imageUrl: IMG.materials["blocks"] },
    { slug: "jelly", name: "Jelly Aggregate", maxLoad: "Ton Load", recommendedUse: "Jelly stone aggregate", imageUrl: IMG.materials["jelly"] },
    { slug: "stone", name: "Stone", maxLoad: "Ton Load", recommendedUse: "Construction stone", imageUrl: IMG.materials["stone"] },
    { slug: "soil", name: "Soil", maxLoad: "Ton Load", recommendedUse: "Filling/construction soil", imageUrl: IMG.materials["soil"] },
    { slug: "other-materials", name: "Other Materials", maxLoad: "As required", recommendedUse: "Other construction material", imageUrl: IMG.materials["other-materials"] },
  ];
  for (const m of materialDefs) {
    priceRows.push({ serviceSlug: "material-supply", vehicleSlug: m.slug, itemType: m.name, minFare: 0, minKm: 0, slabs: "", perKm: 30, loading: 0, waiting: 0, commission: 0, advance: 25, notes: "Delivery based on KM and load" });
    vehicleDefs.push(m);
  }

  const machineryDefs: VDef[] = [
    { slug: "jcb", name: "JCB", maxLoad: "Machine", recommendedUse: "Excavation & earth-moving (min 2 hrs)", imageUrl: IMG.machinery["jcb"] },
    { slug: "excavator", name: "Excavator (Hitachi)", maxLoad: "Machine", recommendedUse: "Deep excavation (min 4 hrs)", imageUrl: IMG.machinery["excavator"] },
    { slug: "tractor", name: "Tractor", maxLoad: "Machine", recommendedUse: "Farm/haulage (min 2 hrs)", imageUrl: IMG.machinery["tractor"] },
    { slug: "hydra", name: "Crane Hydra", maxLoad: "Machine", recommendedUse: "Lifting & loading (min 4 hrs)", imageUrl: IMG.machinery["hydra"] },
    { slug: "forklift", name: "Forklift", maxLoad: "Machine", recommendedUse: "Warehouse lifting (min 4 hrs)", imageUrl: IMG.machinery["forklift"] },
    { slug: "concrete-mixer", name: "Concrete Mixer", maxLoad: "Machine", recommendedUse: "On-site concrete mixing", imageUrl: IMG.machinery["concrete-mixer"] },
    { slug: "crane", name: "Crane", maxLoad: "Machine", recommendedUse: "Heavy lifting (min 4 hrs)", imageUrl: IMG.machinery["crane"] },
    { slug: "other-machinery", name: "Other Machinery", maxLoad: "Machine", recommendedUse: "Other construction machinery", imageUrl: IMG.machinery["other-machinery"] },
  ];
  for (const mc of machineryDefs) {
    const rate = mc.slug === "jcb" ? 1200 : mc.slug === "excavator" || mc.slug === "hydra" || mc.slug === "crane" ? 2500 : mc.slug === "tractor" ? 800 : mc.slug === "forklift" ? 1800 : 1500;
    const minHrs = mc.slug === "jcb" || mc.slug === "tractor" ? 2 : 4;
    // machinery is hourly-priced (pricingType=hourly); minimumFare = rate × minHrs (the min booking)
    priceRows.push({ serviceSlug: "machinery-rental", vehicleSlug: mc.slug, itemType: mc.name, minFare: rate * minHrs, minKm: 2, slabs: "", perKm: 40, loading: 0, waiting: 0, commission: 0, advance: 25, notes: `Minimum ${minHrs} hours @ ₹${rate}/hour`, pricingType: "hourly", perUnitRate: rate });
    vehicleDefs.push(mc);
  }

  // Water tanker vehicle definitions
  const waterDefs: VDef[] = [
    { slug: "2kl", name: "2KL Water Tanker", maxLoad: "2 KL", recommendedUse: "Small water need — domestic/small site", imageUrl: IMG.water["2kl"] },
    { slug: "4kl", name: "4KL Water Tanker", maxLoad: "4 KL", recommendedUse: "Medium water supply", imageUrl: IMG.water["4kl"] },
    { slug: "6kl", name: "6KL Water Tanker", maxLoad: "6 KL", recommendedUse: "Large domestic / small commercial", imageUrl: IMG.water["6kl"] },
    { slug: "12kl", name: "12KL Water Tanker", maxLoad: "12 KL", recommendedUse: "Commercial / construction site", imageUrl: IMG.water["12kl"] },
    { slug: "drinking-water", name: "Drinking Water", maxLoad: "Potable", recommendedUse: "Safe potable drinking water", imageUrl: IMG.water["drinking-water"] },
    { slug: "borewell-water", name: "Borewell Water", maxLoad: "Non-potable", recommendedUse: "Borewell water for non-drinking use", imageUrl: IMG.water["borewell-water"] },
    { slug: "construction-water", name: "Construction Water", maxLoad: "Site use", recommendedUse: "Water for construction sites", imageUrl: IMG.water["construction-water"] },
    { slug: "water-cans-20l", name: "Water Cans (20L)", maxLoad: "20 Litre per can", recommendedUse: "20L water cans for homes/offices. Minimum 5 cans.", imageUrl: "https://sfile.chatglm.cn/images-ppt/d0662c88cdf3.jpg" },
  ];
  for (const w of waterDefs) vehicleDefs.push(w);
  // Add water cans price row — ₹60 per can, minimum 5 cans
  priceRows.push({ serviceSlug: "water-supply", vehicleSlug: "water-cans-20l", itemType: "Water Cans (20L)", minFare: 300, minKm: 0, slabs: "", perKm: 15, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "₹60 per 20L can. Minimum 5 cans (₹300). + ₹15/km delivery. Real 20L can photo." });

  // Outstation uses the larger trucks (already defined under goods-transport). Add outstation service prices mirroring them with round-trip multiplier.
  for (const vs of ["14ft","17ft","19ft","20ft","32ft","407","pickup-9ft"]) {
    const base = priceRows.find((p) => p.vehicleSlug === vs && p.serviceSlug === "goods-transport");
    if (base) {
      priceRows.push({ ...base, serviceSlug: "outstation-booking", notes: (base.notes || "") + " (Outstation)", roundTripMultiplier: 1.8 });
    }
  }

  // Emergency — uses 2-wheeler/scooter base pricing + rush surcharge % on top
  const emergencyDef: VDef = { slug: "emergency-service", name: "Emergency Rush Booking", maxLoad: "Urgent", recommendedUse: "Rush surcharge applied; instant admin alert", imageUrl: IMG.services["emergency-booking"] };
  vehicleDefs.push(emergencyDef);
  priceRows.push({ serviceSlug: "emergency-booking", vehicleSlug: "emergency-service", itemType: "Emergency Rush", minFare: 150, minKm: 3, slabs: "4-10 km: 18 per km, 11-25 km: 15 per km, 26+ km: 13 per km", perKm: 0, loading: 0, waiting: 0, commission: 0, advance: 0, notes: "Rush surcharge 25% on top of normal fare. Instant WhatsApp + Ntfy alert to admin.", rushSurchargePercent: 25 });

  // Supplier/shop products — multiple grocery/ration items with per-unit prices + images
  const shopProducts: VDef[] = [
    { slug: "packed-ration-grocery", name: "Packed Ration & Grocery", maxLoad: "As required", recommendedUse: "FSSAI-approved mixed ration pack", imageUrl: IMG.services["supplier-shop"] },
    { slug: "rice", name: "Rice (25kg Bag)", maxLoad: "25 kg Bag", recommendedUse: "Sona Masoori / Ponni rice", imageUrl: "https://sfile.chatglm.cn/images-ppt/b7264724c63a.jpg" },
    { slug: "atta", name: "Wheat Flour / Atta (10kg)", maxLoad: "10 kg Bag", recommendedUse: "Whole wheat atta for roti/chapati", imageUrl: "https://sfile.chatglm.cn/images-ppt/72dde57105be.png" },
    { slug: "cooking-oil", name: "Cooking Oil (5L)", maxLoad: "5 Litre", recommendedUse: "Sunflower / Refined oil", imageUrl: "https://sfile.chatglm.cn/images-ppt/5549e3b552b5.jpg" },
    { slug: "dal", name: "Dal / Pulses (1kg)", maxLoad: "1 kg Pack", recommendedUse: "Toor / Moong / Chana dal", imageUrl: "https://sfile.chatglm.cn/images-ppt/803acae14d49.jpg" },
    { slug: "sugar", name: "Sugar (1kg)", maxLoad: "1 kg Pack", recommendedUse: "Refined white sugar", imageUrl: "https://sfile.chatglm.cn/images-ppt/4b7a5ba1f731.jpg" },
    { slug: "salt", name: "Salt (1kg)", maxLoad: "1 kg Pack", recommendedUse: "Iodised table salt", imageUrl: "https://sfile.chatglm.cn/images-ppt/8591332bba3f.jpg" },
    { slug: "tea", name: "Tea (500g)", maxLoad: "500 g Pack", recommendedUse: "Tea powder / tea bags", imageUrl: "https://sfile.chatglm.cn/images-ppt/829930d623d0.jpg" },
  ];
  for (const sp of shopProducts) {
    vehicleDefs.push(sp);
    const basePrice = sp.slug === "packed-ration-grocery" ? 150 : sp.slug === "rice" ? 1200 : sp.slug === "atta" ? 450 : sp.slug === "cooking-oil" ? 850 : sp.slug === "dal" ? 120 : sp.slug === "sugar" ? 45 : sp.slug === "salt" ? 25 : 250;
    priceRows.push({ serviceSlug: "supplier-shop", vehicleSlug: sp.slug, itemType: sp.name, minFare: basePrice, minKm: 0, slabs: "", perKm: 20, loading: 0, waiting: 0, commission: 0, advance: 0, notes: `${sp.name}. Base ₹${basePrice} + ₹20/km delivery. FSSAI required.` });
  }

  // Borewell drilling vehicles — SEPARATE service (borewell-drilling), per-foot pricing
  // ₹98/ft for first 100ft, ₹110/ft after 100ft — admin-editable via Price Master
  const borewellVehicles: VDef[] = [
    { slug: "borewell-rig-4-inch", name: "Borewell Rig 4″ (4 inch)", maxLoad: "4 inch borewell", recommendedUse: "Domestic borewell drilling — 4 inch diameter", imageUrl: "https://sfile.chatglm.cn/images-ppt/99526e6cecef.jpg" },
    { slug: "borewell-rig-6-inch", name: "Borewell Rig 6″ (6 inch)", maxLoad: "6 inch borewell", recommendedUse: "Agriculture / commercial borewell — 6 inch diameter", imageUrl: "https://sfile.chatglm.cn/images-ppt/2543e28e3c95.jpg" },
    { slug: "borewell-rig-8-inch", name: "Borewell Rig 8″ (8 inch)", maxLoad: "8 inch borewell", recommendedUse: "Deep borewell drilling — 8 inch diameter", imageUrl: "https://sfile.chatglm.cn/images-ppt/9d8b0d94cda4.jpg" },
    { slug: "borewell-flush", name: "Borewell Flushing Service", maxLoad: "Service", recommendedUse: "Borewell cleaning and flushing — all sizes", imageUrl: IMG.water["borewell-water"] },
  ];
  for (const bv of borewellVehicles) {
    vehicleDefs.push(bv);
    // Per-foot pricing: ₹98/ft up to 100ft, ₹110/ft after 100ft
    // Stored in slabJson as text so admin can edit easily
    // minimumFare = base mobilization charge, perKmRate = transport per km
    const basePrice = bv.slug === "borewell-rig-4-inch" ? 2000 : bv.slug === "borewell-rig-6-inch" ? 3000 : bv.slug === "borewell-rig-8-inch" ? 5000 : 2000;
    const perFtSlab = bv.slug === "borewell-flush" ? "" : "0-100 ft: 98 per ft, 101+ ft: 110 per ft";
    priceRows.push({
      serviceSlug: "borewell-drilling",
      vehicleSlug: bv.slug,
      itemType: bv.name,
      minFare: basePrice,
      minKm: 0,
      slabs: perFtSlab,
      perKm: 50,
      loading: 0,
      waiting: 0,
      commission: 0,
      advance: 25,
      notes: bv.slug === "borewell-flush"
        ? "Borewell flushing service. Base ₹2000 + ₹50/km transport."
        : `Borewell drilling per-foot: ₹98/ft up to 100ft, ₹110/ft after 100ft. Base mobilization ₹${basePrice}. + ₹50/km transport. All rates admin-editable.`,
    });
  }

  // Create vehicles + prices
  const vehicleMap: Record<string, number> = {};
  for (const v of vehicleDefs) {
    let serviceSlug = "goods-transport";
    if (["sand","m-sand","cement","steel","bricks","blocks","jelly","stone","soil","other-materials"].includes(v.slug)) serviceSlug = "material-supply";
    else if (["jcb","excavator","tractor","hydra","forklift","concrete-mixer","crane","other-machinery"].includes(v.slug)) serviceSlug = "machinery-rental";
    else if (["2kl","4kl","6kl","12kl","drinking-water","borewell-water","construction-water"].includes(v.slug)) serviceSlug = "water-supply";
    else if (["borewell-rig-4-inch","borewell-rig-6-inch","borewell-rig-8-inch","borewell-flush"].includes(v.slug)) serviceSlug = "borewell-drilling";
    else if (["2-wheeler","scooter"].includes(v.slug)) serviceSlug = "parcel-delivery";
    else if (v.slug === "emergency-service") serviceSlug = "emergency-booking";
    else if (["packed-ration-grocery","rice","atta","cooking-oil","dal","sugar","salt","tea"].includes(v.slug)) serviceSlug = "supplier-shop";
    const serviceId = svcMap[serviceSlug];
    if (!serviceId) continue;
    const veh = await db.vehicle.create({ data: { serviceId, name: v.name, slug: v.slug, maxLoad: v.maxLoad, imageUrl: v.imageUrl, recommendedUse: v.recommendedUse, status: "Active" } });
    vehicleMap[v.slug] = veh.id;
  }

  // ---- Create material shops (multiple per material, with addresses) ----
  // Each shop has a registered address (lat/lng) for distance-based delivery calc + flat-fee fallback.
  const shopSeeds = [
    { name: "Sri Lakshmi Hardware & Sand", address: "KR Market, Bengaluru 560002", lat: 12.9655, lng: 77.5726, flatFee: 200 },
    { name: "Ganesh Cement & Steel", address: "Yeshwanthpur, Bengaluru 560022", lat: 13.0285, lng: 77.5402, flatFee: 250 },
    { name: "Malleshwara Building Materials", address: "Malleshwaram, Bengaluru 560003", lat: 13.0035, lng: 77.5647, flatFee: 180 },
    { name: "Hosur Road Construction Supply", address: "Hosur Road, Bengaluru 560068", lat: 12.9141, lng: 77.6101, flatFee: 220 },
  ];
  const shopMap: number[] = [];
  for (const s of shopSeeds) {
    const sup = await db.supplier.create({
      data: {
        supplierName: s.name, shopName: s.name, mobile: "9741433725", whatsapp: "919741433725",
        address: s.address, addressLat: s.lat, addressLng: s.lng, addressMapLink: `https://www.google.com/maps?q=${s.lat},${s.lng}`,
        flatDeliveryFee: s.flatFee, supplierType: "Material", status: "Approved",
      },
    });
    shopMap.push(sup.id);
  }

  // Build material price rows: each material × each shop, with per-unit rate + unit type.
  // per-unit rates vary per shop so the "best landed price" differs by distance + rate.
  const materialUnitTypes: Record<string, { unit: string; baseRate: number }> = {
    sand: { unit: "Ton", baseRate: 1200 },
    "m-sand": { unit: "Ton", baseRate: 950 },
    cement: { unit: "Bag", baseRate: 390 },
    steel: { unit: "Kg", baseRate: 65 },
    bricks: { unit: "Piece", baseRate: 8 },
    blocks: { unit: "Piece", baseRate: 32 },
    jelly: { unit: "Ton", baseRate: 850 },
    stone: { unit: "Ton", baseRate: 1100 },
    soil: { unit: "Ton", baseRate: 450 },
    "other-materials": { unit: "Load", baseRate: 1500 },
  };
  const materialPriceRows: any[] = [];
  for (const m of materialDefs) {
    const cfg = materialUnitTypes[m.slug] || { unit: "Load", baseRate: 1000 };
    // each shop offers this material at a slightly different rate (±5-10% around base)
    shopMap.forEach((shopId, i) => {
      const variance = [1.0, 0.95, 1.05, 0.97][i % 4];
      const rate = Math.round(cfg.baseRate * variance);
      materialPriceRows.push({
        serviceSlug: "material-supply",
        vehicleSlug: m.slug,
        itemType: m.name,
        supplierId: shopId,
        unitType: cfg.unit,
        perUnitRate: rate,
        perKm: 0, // delivery is computed separately via shop→location distance
        minFare: 0, minKm: 0, slabs: "", loading: 0, waiting: 0, commission: 0, advance: 25,
        notes: `${m.name} @ ₹${rate}/${cfg.unit} from ${shopSeeds[i % 4].name}`,
        pricingType: "per-unit",
      });
    });
  }

  for (const p of [...priceRows, ...materialPriceRows]) {
    const serviceId = svcMap[p.serviceSlug];
    const vehicleId = vehicleMap[p.vehicleSlug];
    if (!serviceId || !vehicleId) { console.log("SKIP", p.serviceSlug, p.vehicleSlug); continue; }
    await db.priceMaster.create({
      data: {
        serviceId, vehicleId, supplierId: p.supplierId || null, itemType: p.itemType,
        pricingType: p.pricingType || "standard",
        unitType: p.unitType || null, perUnitRate: p.perUnitRate || 0,
        minimumKm: p.minKm, minimumFare: p.minFare, perKmRate: p.perKm, slabJson: p.slabs,
        loadingCharge: p.loading, waitingCharge: p.waiting, helperCharge: 0,
        nightChargePercent: 0, expressChargePercent: 0, extraCharge: 0, discountPercent: 0,
        gstPercent: 5, advancePercent: p.advance, minimumBooking: 0, commissionPercent: p.commission,
        roundTripMultiplier: p.roundTripMultiplier || 1.8,
        rushSurchargePercent: p.rushSurchargePercent || 0,
        notes: p.notes, status: "Active",
      },
    });
  }
  console.log(`✓ ${vehicleDefs.length} vehicles + ${priceRows.length + materialPriceRows.length} price-master rows (incl. ${materialPriceRows.length} material-shop rows) + ${shopMap.length} shops`);

  // ---- SEO ----
  const seoSeed = [
    { pageSlug: "home", title: "ParcelMaadi — Fast Local Reliable Parcel & Goods Delivery", description: "Book parcel delivery, goods vehicles, water tankers, construction material and machinery rental in minutes. By HP Enterprise." },
    { pageSlug: "services", title: "Our Services — ParcelMaadi", description: "8 services: parcel, goods transport, material supply, machinery rental, water supply, supplier/shop, outstation, emergency." },
    { pageSlug: "terms", title: "Terms & Conditions — ParcelMaadi", description: "Terms and conditions for ParcelMaadi by HP Enterprise." },
    { pageSlug: "privacy", title: "Privacy Policy — ParcelMaadi", description: "Privacy policy for ParcelMaadi by HP Enterprise." },
    { pageSlug: "refund", title: "Refund & Cancellation Policy — ParcelMaadi", description: "Refund and cancellation policy for ParcelMaadi by HP Enterprise." },
  ];
  for (const s of seoSeed) {
    await db.seoSetting.upsert({ where: { pageSlug: s.pageSlug }, update: {}, create: s });
  }
  console.log("✓ SEO settings (incl. policy pages)");

  console.log("\n✅ Seed v2 complete.");
  console.log("Admin logins (all password: admin123 — CHANGE BEFORE DEPLOYMENT):");
  console.log("  admin@parcelmaadi.com (Owner)");
  console.log("  ops@parcelmaadi.com (Operations)");
  console.log("  accounts@parcelmaadi.com (Accounts)");
  console.log("  view@parcelmaadi.com (View-only)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
