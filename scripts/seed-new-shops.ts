// Add 8 NEW shop types to the existing 4 material shops.
// Each shop has 6-8 products with REAL, UNIQUE, RELEVANT images (no repeats, no unrelated).
// Categories: Electrical, Hardware, Fashion, Mobile, Books, Fancy, Household, Gifts
import { db } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

// Load image URL map (fetched via z-ai image-search)
function loadUrlMap(): Record<string, string> {
  const candidates = [
    "/home/z/my-project/scripts/images/url_map.json",
    path.join(process.cwd(), "scripts/images/url_map.json"),
    path.join(process.cwd(), "url_map.json"),
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

// Helper: get image URL with fallback to a category placeholder
function img(key: string, fallbackQuery: string): string {
  return (
    IMG[key] ||
    `https://placehold.co/400x300/e5e7eb/6b7280?text=${encodeURIComponent(fallbackQuery)}`
  );
}

// New shops
const NEW_SHOPS = [
  { id: 5, shopName: "Sri Vinayaka Electricals", supplierName: "Suresh Kumar", supplierType: "Electrical", address: "Gandhi Bazaar, Bengaluru 560004", mobile: "9845012345", whatsapp: "919845012345", flatDeliveryFee: 50 },
  { id: 6, shopName: "Anjani Hardware & Tools", supplierName: "Ramesh Babu", supplierType: "Hardware", address: "Jayanagar 4th Block, Bengaluru 560011", mobile: "9845023456", whatsapp: "919845023456", flatDeliveryFee: 80 },
  { id: 7, shopName: "Style Bazaar Fashion Hub", supplierName: "Lakshmi Devi", supplierType: "Fashion", address: "Commercial Street, Bengaluru 560001", mobile: "9845034567", whatsapp: "919845034567", flatDeliveryFee: 60 },
  { id: 8, shopName: "Smart Mobile World", supplierName: "Imran Khan", supplierType: "Mobile", address: "SP Road, Bengaluru 560002", mobile: "9845045678", whatsapp: "919845045678", flatDeliveryFee: 40 },
  { id: 9, shopName: "Vidya Book Stall", supplierName: "Venkatesh R", supplierType: "Books", address: "Malleshwaram, Bengaluru 560003", mobile: "9845056789", whatsapp: "919845056789", flatDeliveryFee: 35 },
  { id: 10, shopName: "Sri Ganesh Fancy Store", supplierName: "Manjunath", supplierType: "Fancy", address: "Basavangudi, Bengaluru 560004", mobile: "9845067890", whatsapp: "919845067890", flatDeliveryFee: 45 },
  { id: 11, shopName: "Siri Household Items", supplierName: "Geetha R", supplierType: "Household", address: "Rajajinagar, Bengaluru 560010", mobile: "9845078901", whatsapp: "919845078901", flatDeliveryFee: 70 },
  { id: 12, shopName: "Gifts Galore by Priya", supplierName: "Priya S", supplierType: "Gifts", address: "Indiranagar 100ft Road, Bengaluru 560038", mobile: "9845089012", whatsapp: "919845089012", flatDeliveryFee: 50 },
];

// Products — each with a unique relevant image
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
  imgFallback: string;
}

const PRODUCTS: P[] = [
  // === Shop 5: Electrical ===
  { supplierId: 5, category: "Fans", productName: "Crompton Ceiling Fan 1200mm", brand: "Crompton", unit: "Piece", mrp: 2200, supplierPrice: 1800, sellingPrice: 2050, marginPercent: 12, gstPercent: 18, stock: 25, imgKey: "electrical_ceiling_fan", imgFallback: "Ceiling Fan" },
  { supplierId: 5, category: "Lighting", productName: "Philips LED Bulb 9W (Pack of 4)", brand: "Philips", unit: "Pack", mrp: 480, supplierPrice: 360, sellingPrice: 420, marginPercent: 14, gstPercent: 18, stock: 100, imgKey: "electrical_led_bulb", imgFallback: "LED Bulb" },
  { supplierId: 5, category: "Switches", productName: "Anchor Modular Switch 6A (Pack of 10)", brand: "Anchor", unit: "Pack", mrp: 350, supplierPrice: 260, sellingPrice: 310, marginPercent: 16, gstPercent: 18, stock: 80, imgKey: "electrical_switch", imgFallback: "Switch" },
  { supplierId: 5, category: "Wires", productName: "Havells Copper Wire 1.5sq mm 90m", brand: "Havells", unit: "Roll", mrp: 2400, supplierPrice: 2000, sellingPrice: 2250, marginPercent: 11, gstPercent: 18, stock: 30, imgKey: "electrical_wire", imgFallback: "Wire" },
  { supplierId: 5, category: "Sockets", productName: "GM Extension Board 4 Socket 4m", brand: "GM", unit: "Piece", mrp: 850, supplierPrice: 650, sellingPrice: 750, marginPercent: 13, gstPercent: 18, stock: 40, imgKey: "electrical_extension", imgFallback: "Extension" },
  { supplierId: 5, category: "Lighting", productName: "Syska LED Tubelight 20W 4ft", brand: "Syska", unit: "Piece", mrp: 650, supplierPrice: 480, sellingPrice: 560, marginPercent: 14, gstPercent: 18, stock: 50, imgKey: "electrical_tubelight", imgFallback: "Tubelight" },
  { supplierId: 5, category: "Safety", productName: "Havells MCB 32A Double Pole", brand: "Havells", unit: "Piece", mrp: 540, supplierPrice: 410, sellingPrice: 470, marginPercent: 13, gstPercent: 18, stock: 60, imgKey: "electrical_mcb", imgFallback: "MCB" },
  { supplierId: 5, category: "Fans", productName: "Usha Table Fan 400mm", brand: "Usha", unit: "Piece", mrp: 2800, supplierPrice: 2300, sellingPrice: 2600, marginPercent: 12, gstPercent: 18, stock: 18, imgKey: "electrical_table_fan", imgFallback: "Table Fan" },

  // === Shop 6: Hardware ===
  { supplierId: 6, category: "Tools", productName: "Stanley Claw Hammer 500g", brand: "Stanley", unit: "Piece", mrp: 650, supplierPrice: 480, sellingPrice: 580, marginPercent: 17, gstPercent: 18, stock: 35, imgKey: "hardware_hammer", imgFallback: "Hammer" },
  { supplierId: 6, category: "Tools", productName: "Taparia Screwdriver Set (12 pc)", brand: "Taparia", unit: "Set", mrp: 850, supplierPrice: 620, sellingPrice: 750, marginPercent: 17, gstPercent: 18, stock: 22, imgKey: "hardware_screwdriver", imgFallback: "Screwdriver" },
  { supplierId: 6, category: "Paint", productName: "Asian Paints Tractor Emulsion 10L White", brand: "Asian Paints", unit: "Can", mrp: 1850, supplierPrice: 1500, sellingPrice: 1700, marginPercent: 12, gstPercent: 18, stock: 28, imgKey: "hardware_paint", imgFallback: "Paint" },
  { supplierId: 6, category: "Fasteners", productName: "Steel Nails Assorted 1kg Box", brand: "GK", unit: "Box", mrp: 220, supplierPrice: 160, sellingPrice: 195, marginPercent: 18, gstPercent: 18, stock: 120, imgKey: "hardware_nails", imgFallback: "Nails" },
  { supplierId: 6, category: "Power Tools", productName: "Bosch Drill Machine 13mm 600W", brand: "Bosch", unit: "Piece", mrp: 3800, supplierPrice: 3100, sellingPrice: 3500, marginPercent: 12, gstPercent: 18, stock: 12, imgKey: "hardware_drill", imgFallback: "Drill" },
  { supplierId: 6, category: "Pipes", productName: "Supreme PVC Pipe 4 inch 6m", brand: "Supreme", unit: "Pipe", mrp: 950, supplierPrice: 720, sellingPrice: 850, marginPercent: 15, gstPercent: 18, stock: 25, imgKey: "hardware_pvc_pipe", imgFallback: "PVC Pipe" },
  { supplierId: 6, category: "Locks", productName: "Godrej Door Lock with Handle Brass", brand: "Godrej", unit: "Piece", mrp: 920, supplierPrice: 700, sellingPrice: 820, marginPercent: 14, gstPercent: 18, stock: 30, imgKey: "hardware_lock", imgFallback: "Lock" },
  { supplierId: 6, category: "Tools", productName: "Stanley Measuring Tape 5m", brand: "Stanley", unit: "Piece", mrp: 380, supplierPrice: 280, sellingPrice: 340, marginPercent: 18, gstPercent: 18, stock: 45, imgKey: "hardware_tape", imgFallback: "Measuring Tape" },

  // === Shop 7: Fashion ===
  { supplierId: 7, category: "Mens Wear", productName: "Peter England Cotton Formal Shirt Blue", brand: "Peter England", unit: "Piece", mrp: 1599, supplierPrice: 1100, sellingPrice: 1399, marginPercent: 21, gstPercent: 5, stock: 40, imgKey: "fashion_mens_shirt", imgFallback: "Mens Shirt" },
  { supplierId: 7, category: "Womens Wear", productName: "Silk Saree Red with Blouse Piece", brand: "Kanchi", unit: "Piece", mrp: 3500, supplierPrice: 2500, sellingPrice: 2999, marginPercent: 18, gstPercent: 5, stock: 15, imgKey: "fashion_saree", imgFallback: "Saree" },
  { supplierId: 7, category: "Footwear", productName: "Bata Leather Shoes Brown Size 42", brand: "Bata", unit: "Pair", mrp: 2200, supplierPrice: 1600, sellingPrice: 1999, marginPercent: 20, gstPercent: 5, stock: 25, imgKey: "fashion_shoes", imgFallback: "Shoes" },
  { supplierId: 7, category: "Mens Wear", productName: "Levis Denim Jeans Blue 32x32", brand: "Levis", unit: "Piece", mrp: 2999, supplierPrice: 2200, sellingPrice: 2699, marginPercent: 18, gstPercent: 5, stock: 20, imgKey: "fashion_jeans", imgFallback: "Jeans" },
  { supplierId: 7, category: "Bags", productName: "Lavie Leather Handbag Tan", brand: "Lavie", unit: "Piece", mrp: 2800, supplierPrice: 2000, sellingPrice: 2499, marginPercent: 20, gstPercent: 5, stock: 12, imgKey: "fashion_handbag", imgFallback: "Handbag" },
  { supplierId: 7, category: "Watches", productName: "Titan Analog Watch Black Dial", brand: "Titan", unit: "Piece", mrp: 3500, supplierPrice: 2600, sellingPrice: 3199, marginPercent: 19, gstPercent: 18, stock: 18, imgKey: "fashion_watch", imgFallback: "Watch" },
  { supplierId: 7, category: "Accessories", productName: "Fastrack Aviator Sunglasses", brand: "Fastrack", unit: "Piece", mrp: 1800, supplierPrice: 1300, sellingPrice: 1599, marginPercent: 19, gstPercent: 18, stock: 22, imgKey: "fashion_sunglasses", imgFallback: "Sunglasses" },
  { supplierId: 7, category: "Mens Wear", productName: "US Polo Cotton T-Shirt Navy M", brand: "US Polo", unit: "Piece", mrp: 999, supplierPrice: 700, sellingPrice: 899, marginPercent: 22, gstPercent: 5, stock: 35, imgKey: "fashion_tshirt", imgFallback: "T-Shirt" },

  // === Shop 8: Mobile ===
  { supplierId: 8, category: "Smartphones", productName: "Redmi 13C 6GB 128GB Black", brand: "Redmi", unit: "Piece", mrp: 11999, supplierPrice: 10500, sellingPrice: 11499, marginPercent: 9, gstPercent: 18, stock: 15, imgKey: "mobile_smartphone", imgFallback: "Smartphone" },
  { supplierId: 8, category: "Accessories", productName: "Spigen Silicone Phone Case (Multiple Models)", brand: "Spigen", unit: "Piece", mrp: 699, supplierPrice: 450, sellingPrice: 599, marginPercent: 25, gstPercent: 18, stock: 80, imgKey: "mobile_case", imgFallback: "Phone Case" },
  { supplierId: 8, category: "Chargers", productName: "Mi 33W USB-C Fast Charger", brand: "Mi", unit: "Piece", mrp: 999, supplierPrice: 700, sellingPrice: 899, marginPercent: 22, gstPercent: 18, stock: 40, imgKey: "mobile_charger", imgFallback: "Charger" },
  { supplierId: 8, category: "Audio", productName: "boAt Airdopes 141 Wireless Earbuds", brand: "boAt", unit: "Piece", mrp: 2990, supplierPrice: 2000, sellingPrice: 2499, marginPercent: 20, gstPercent: 18, stock: 30, imgKey: "mobile_earbuds", imgFallback: "Earbuds" },
  { supplierId: 8, category: "Power Banks", productName: "Mi Power Bank 20000mAh 18W", brand: "Mi", unit: "Piece", mrp: 1999, supplierPrice: 1400, sellingPrice: 1799, marginPercent: 22, gstPercent: 18, stock: 25, imgKey: "mobile_powerbank", imgFallback: "Power Bank" },
  { supplierId: 8, category: "Accessories", productName: "Tempered Glass Screen Protector Universal", brand: "Generic", unit: "Piece", mrp: 199, supplierPrice: 100, sellingPrice: 149, marginPercent: 33, gstPercent: 18, stock: 200, imgKey: "mobile_screenguard", imgFallback: "Screen Guard" },
  { supplierId: 8, category: "Cables", productName: "Anker USB-C Braided Cable 1m", brand: "Anker", unit: "Piece", mrp: 599, supplierPrice: 400, sellingPrice: 499, marginPercent: 20, gstPercent: 18, stock: 60, imgKey: "mobile_cable", imgFallback: "USB Cable" },
  { supplierId: 8, category: "Accessories", productName: "Adjustable Mobile Phone Stand Aluminum", brand: "Generic", unit: "Piece", mrp: 399, supplierPrice: 250, sellingPrice: 349, marginPercent: 28, gstPercent: 18, stock: 45, imgKey: "mobile_stand", imgFallback: "Phone Stand" },

  // === Shop 9: Books ===
  { supplierId: 9, category: "Stationery", productName: "Classmate Notebook 200 Pages Ruled (Pack of 5)", brand: "Classmate", unit: "Pack", mrp: 350, supplierPrice: 260, sellingPrice: 310, marginPercent: 16, gstPercent: 12, stock: 100, imgKey: "book_notebook", imgFallback: "Notebook" },
  { supplierId: 9, category: "Stationery", productName: "Reynolds Ball Pen Blue (Pack of 10)", brand: "Reynolds", unit: "Pack", mrp: 100, supplierPrice: 70, sellingPrice: 89, marginPercent: 21, gstPercent: 12, stock: 200, imgKey: "book_pen", imgFallback: "Pen" },
  { supplierId: 9, category: "Textbooks", productName: "NCERT Mathematics Class 10", brand: "NCERT", unit: "Piece", mrp: 180, supplierPrice: 140, sellingPrice: 165, marginPercent: 15, gstPercent: 0, stock: 50, imgKey: "book_textbook", imgFallback: "Textbook" },
  { supplierId: 9, category: "Stationery", productName: "Natraj Pencil HB (Pack of 10)", brand: "Natraj", unit: "Pack", mrp: 80, supplierPrice: 55, sellingPrice: 70, marginPercent: 21, gstPercent: 12, stock: 150, imgKey: "book_pencil", imgFallback: "Pencil" },
  { supplierId: 9, category: "Bags", productName: "Skybags School Backpack 30L", brand: "Skybags", unit: "Piece", mrp: 1500, supplierPrice: 1100, sellingPrice: 1350, marginPercent: 18, gstPercent: 18, stock: 25, imgKey: "book_bag", imgFallback: "School Bag" },
  { supplierId: 9, category: "Art", productName: "Faber-Castell Color Pencil Set 24 shades", brand: "Faber-Castell", unit: "Set", mrp: 320, supplierPrice: 240, sellingPrice: 290, marginPercent: 17, gstPercent: 12, stock: 40, imgKey: "book_color_pencil", imgFallback: "Color Pencil" },
  { supplierId: 9, category: "Stationery", productName: "Moleskine Leather Diary 2026 A5", brand: "Moleskine", unit: "Piece", mrp: 850, supplierPrice: 600, sellingPrice: 750, marginPercent: 20, gstPercent: 12, stock: 30, imgKey: "book_diary", imgFallback: "Diary" },
  { supplierId: 9, category: "Stationery", productName: "Classmate Geometry Box with Eraser", brand: "Classmate", unit: "Set", mrp: 180, supplierPrice: 130, sellingPrice: 160, marginPercent: 19, gstPercent: 12, stock: 60, imgKey: "book_eraser", imgFallback: "Geometry Box" },

  // === Shop 10: Fancy ===
  { supplierId: 10, category: "Decor", productName: "Glass Decorative Vase 8 inch", brand: "Generic", unit: "Piece", mrp: 750, supplierPrice: 500, sellingPrice: 650, marginPercent: 23, gstPercent: 18, stock: 20, imgKey: "fancy_vase", imgFallback: "Vase" },
  { supplierId: 10, category: "Clocks", productName: "Analog Wall Clock 12 inch White", brand: "Ajanta", unit: "Piece", mrp: 650, supplierPrice: 450, sellingPrice: 580, marginPercent: 22, gstPercent: 18, stock: 25, imgKey: "fancy_wallclock", imgFallback: "Wall Clock" },
  { supplierId: 10, category: "Frames", productName: "Wooden Photo Frame 8x10 inch", brand: "Generic", unit: "Piece", mrp: 450, supplierPrice: 300, sellingPrice: 399, marginPercent: 25, gstPercent: 18, stock: 35, imgKey: "fancy_photoframe", imgFallback: "Photo Frame" },
  { supplierId: 10, category: "Decor", productName: "Scented Candle Jar Set (3 pc)", brand: "Yankee", unit: "Set", mrp: 850, supplierPrice: 580, sellingPrice: 750, marginPercent: 23, gstPercent: 18, stock: 28, imgKey: "fancy_candle", imgFallback: "Scented Candle" },
  { supplierId: 10, category: "Decor", productName: "Artificial Rose Flowers Bouquet", brand: "Generic", unit: "Bouquet", mrp: 550, supplierPrice: 380, sellingPrice: 499, marginPercent: 24, gstPercent: 18, stock: 30, imgKey: "fancy_flowers", imgFallback: "Flowers" },
  { supplierId: 10, category: "Decor", productName: "Brass Showpiece Ganesha 6 inch", brand: "Generic", unit: "Piece", mrp: 1250, supplierPrice: 900, sellingPrice: 1100, marginPercent: 18, gstPercent: 18, stock: 15, imgKey: "fancy_showpiece", imgFallback: "Showpiece" },
  { supplierId: 10, category: "Decor", productName: "Embroidered Cushion Cover Set (5 pc)", brand: "Generic", unit: "Set", mrp: 650, supplierPrice: 450, sellingPrice: 580, marginPercent: 22, gstPercent: 18, stock: 22, imgKey: "fancy_cushion", imgFallback: "Cushion Cover" },
  { supplierId: 10, category: "Lighting", productName: "LED String Fairy Lights 5m Warm White", brand: "Generic", unit: "Piece", mrp: 350, supplierPrice: 220, sellingPrice: 299, marginPercent: 26, gstPercent: 18, stock: 50, imgKey: "fancy_fairy_lights", imgFallback: "Fairy Lights" },

  // === Shop 11: Household ===
  { supplierId: 11, category: "Kitchen", productName: "Prestige Non-Stick Frying Pan 24cm", brand: "Prestige", unit: "Piece", mrp: 950, supplierPrice: 700, sellingPrice: 850, marginPercent: 18, gstPercent: 12, stock: 30, imgKey: "household_pan", imgFallback: "Frying Pan" },
  { supplierId: 11, category: "Kitchen", productName: "Pigeon Rice Cooker 1.8L 700W", brand: "Pigeon", unit: "Piece", mrp: 1450, supplierPrice: 1100, sellingPrice: 1299, marginPercent: 16, gstPercent: 12, stock: 18, imgKey: "household_rice_cooker", imgFallback: "Rice Cooker" },
  { supplierId: 11, category: "Kitchen", productName: "Prestige Pressure Cooker 5L Aluminum", brand: "Prestige", unit: "Piece", mrp: 1850, supplierPrice: 1400, sellingPrice: 1699, marginPercent: 18, gstPercent: 12, stock: 22, imgKey: "household_pressure_cooker", imgFallback: "Pressure Cooker" },
  { supplierId: 11, category: "Storage", productName: "Tupperware Plastic Container Set (5 pc)", brand: "Tupperware", unit: "Set", mrp: 950, supplierPrice: 700, sellingPrice: 850, marginPercent: 18, gstPercent: 12, stock: 25, imgKey: "household_container", imgFallback: "Container Set" },
  { supplierId: 11, category: "Kitchen", productName: "Milton Stainless Steel Lunch Box 3 Comp", brand: "Milton", unit: "Piece", mrp: 750, supplierPrice: 540, sellingPrice: 649, marginPercent: 18, gstPercent: 12, stock: 35, imgKey: "household_lunchbox", imgFallback: "Lunch Box" },
  { supplierId: 11, category: "Cleaning", productName: "Scotch-Brite Floor Mop with Refill", brand: "Scotch-Brite", unit: "Piece", mrp: 450, supplierPrice: 320, sellingPrice: 399, marginPercent: 20, gstPercent: 18, stock: 40, imgKey: "household_mop", imgFallback: "Mop" },
  { supplierId: 11, category: "Cleaning", productName: "Vim Dishwash Bar Lemon (Pack of 4)", brand: "Vim", unit: "Pack", mrp: 120, supplierPrice: 80, sellingPrice: 105, marginPercent: 24, gstPercent: 18, stock: 100, imgKey: "household_soap", imgFallback: "Dish Soap" },
  { supplierId: 11, category: "Cleaning", productName: "Gala Floor Broom Stick Large", brand: "Gala", unit: "Piece", mrp: 220, supplierPrice: 160, sellingPrice: 199, marginPercent: 20, gstPercent: 18, stock: 60, imgKey: "household_broom", imgFallback: "Broom" },

  // === Shop 12: Gifts ===
  { supplierId: 12, category: "Cards", productName: "Happy Birthday Greeting Card Premium", brand: "Archies", unit: "Piece", mrp: 150, supplierPrice: 90, sellingPrice: 125, marginPercent: 28, gstPercent: 12, stock: 80, imgKey: "gifts_card", imgFallback: "Gift Card" },
  { supplierId: 12, category: "Soft Toys", productName: "Plush Teddy Bear Brown 2ft", brand: "Generic", unit: "Piece", mrp: 999, supplierPrice: 650, sellingPrice: 850, marginPercent: 23, gstPercent: 18, stock: 20, imgKey: "gifts_teddy", imgFallback: "Teddy Bear" },
  { supplierId: 12, category: "Chocolates", productName: "Cadbury Celebrations Assorted Box 240g", brand: "Cadbury", unit: "Box", mrp: 550, supplierPrice: 420, sellingPrice: 499, marginPercent: 16, gstPercent: 18, stock: 50, imgKey: "gifts_chocolate", imgFallback: "Chocolate Box" },
  { supplierId: 12, category: "Hampers", productName: "Festive Gift Basket (Snacks + Sweets)", brand: "Generic", unit: "Basket", mrp: 1800, supplierPrice: 1300, sellingPrice: 1650, marginPercent: 21, gstPercent: 12, stock: 15, imgKey: "gifts_basket", imgFallback: "Gift Basket" },
  { supplierId: 12, category: "Flowers", productName: "Red Roses Bouquet (12 stems)", brand: "Ferns N Petals", unit: "Bouquet", mrp: 999, supplierPrice: 700, sellingPrice: 899, marginPercent: 22, gstPercent: 12, stock: 25, imgKey: "gifts_bouquet", imgFallback: "Flower Bouquet" },
  { supplierId: 12, category: "Cards", productName: "Assorted Greeting Cards Pack (10 pc)", brand: "Archies", unit: "Pack", mrp: 350, supplierPrice: 230, sellingPrice: 299, marginPercent: 23, gstPercent: 12, stock: 30, imgKey: "gifts_greeting", imgFallback: "Greeting Cards" },
  { supplierId: 12, category: "Accessories", productName: "Metal Key Chain Set (5 pc)", brand: "Generic", unit: "Set", mrp: 199, supplierPrice: 120, sellingPrice: 169, marginPercent: 29, gstPercent: 18, stock: 70, imgKey: "gifts_keychain", imgFallback: "Key Chain" },
  { supplierId: 12, category: "Wrapping", productName: "Gift Wrapping Paper Roll Set (5 designs)", brand: "Generic", unit: "Set", mrp: 299, supplierPrice: 180, sellingPrice: 249, marginPercent: 28, gstPercent: 18, stock: 60, imgKey: "gifts_wrapping", imgFallback: "Wrapping Paper" },
];

async function main() {
  console.log(`Adding ${NEW_SHOPS.length} new shops + ${PRODUCTS.length} new products...`);

  // Step 1: Insert new suppliers (upsert — keep existing 4)
  for (const s of NEW_SHOPS) {
    const existing = await db.supplier.findUnique({ where: { id: s.id } });
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
      console.log(`  ✅ Created shop ${s.id}: ${s.shopName} (${s.supplierType})`);
    } else {
      console.log(`  ⏭️  Shop ${s.id} already exists: ${s.shopName}`);
    }
  }

  // Step 2: Insert products (skip existing — keep the 27 material products from before)
  let inserted = 0;
  let skipped = 0;
  for (const p of PRODUCTS) {
    // Check if this product already exists (by name+supplier)
    const existing = await db.product.findFirst({
      where: { supplierId: p.supplierId, productName: p.productName },
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
        marginPercent: p.marginPercent ?? 15,
        gstPercent: p.gstPercent ?? 12,
        handlingFee: 0,
        stock: p.stock ?? 0,
        city: "Bengaluru",
        pincode: "560001",
        photoUrl: img(p.imgKey, p.imgFallback),
        status: "Active",
      },
    });
    inserted++;
  }
  console.log(`\n✅ Products: ${inserted} new inserted, ${skipped} existing skipped`);

  // Step 3: Verify
  const totalShops = await db.supplier.count();
  const totalProducts = await db.product.count();
  console.log(`\n📊 Final DB state:`);
  console.log(`   Total shops (suppliers): ${totalShops}`);
  console.log(`   Total products: ${totalProducts}`);

  const byShop = await db.product.groupBy({ by: ["supplierId"], _count: { id: true } });
  for (const s of byShop) {
    const supplier = await db.supplier.findUnique({ where: { id: s.supplierId } });
    console.log(`   Shop ${s.supplierId} (${supplier?.shopName}, ${supplier?.supplierType}): ${s._count.id} products`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
