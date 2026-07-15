// ParcelMaadi seed data — grocery catalog.
// 13 categories, 90 products, Karnataka market pricing (July 2026 reference).
// price = ParcelMaadi selling price; mrp = printed MRP for strike-through.
// Admin edits prices/stock from the panel (Module 4) — nothing hardcoded in UI.

export type GroceryProductSeed = {
  name: string;
  unit: string;
  price: number;
  mrp?: number;
};

export type GroceryCategorySeed = {
  name: string;
  slug: string;
  sortOrder: number;
  products: GroceryProductSeed[];
};

export const groceryCatalog: GroceryCategorySeed[] = [
  {
    name: "Rice & Grains",
    slug: "rice-grains",
    sortOrder: 1,
    products: [
      { name: "Sona Masoori Rice (Premium)", unit: "5 kg", price: 340, mrp: 375 },
      { name: "Sona Masoori Rice (Regular)", unit: "5 kg", price: 290, mrp: 320 },
      { name: "Basmati Rice", unit: "1 kg", price: 145, mrp: 165 },
      { name: "Idli Rice", unit: "5 kg", price: 310, mrp: 340 },
      { name: "Boiled Rice (Kusubalakki)", unit: "5 kg", price: 300, mrp: 330 },
      { name: "Avalakki (Poha, Thick)", unit: "500 g", price: 38, mrp: 45 },
      { name: "Ragi (Whole)", unit: "1 kg", price: 55, mrp: 65 },
    ],
  },
  {
    name: "Atta & Flours",
    slug: "atta-flours",
    sortOrder: 2,
    products: [
      { name: "Whole Wheat Atta", unit: "5 kg", price: 245, mrp: 270 },
      { name: "Ragi Flour", unit: "1 kg", price: 62, mrp: 70 },
      { name: "Rice Flour", unit: "1 kg", price: 52, mrp: 60 },
      { name: "Maida", unit: "1 kg", price: 48, mrp: 55 },
      { name: "Besan (Gram Flour)", unit: "1 kg", price: 95, mrp: 110 },
      { name: "Rava (Bombay Sooji)", unit: "1 kg", price: 50, mrp: 58 },
      { name: "Chiroti Rava", unit: "500 g", price: 32, mrp: 38 },
    ],
  },
  {
    name: "Dals & Pulses",
    slug: "dals-pulses",
    sortOrder: 3,
    products: [
      { name: "Toor Dal", unit: "1 kg", price: 155, mrp: 175 },
      { name: "Moong Dal", unit: "1 kg", price: 130, mrp: 145 },
      { name: "Chana Dal", unit: "1 kg", price: 95, mrp: 108 },
      { name: "Urad Dal (Whole White)", unit: "1 kg", price: 140, mrp: 158 },
      { name: "Masoor Dal", unit: "1 kg", price: 105, mrp: 118 },
      { name: "Kabuli Chana", unit: "500 g", price: 68, mrp: 78 },
      { name: "Green Gram (Whole Moong)", unit: "500 g", price: 62, mrp: 70 },
      { name: "Groundnut (Raw)", unit: "500 g", price: 72, mrp: 82 },
    ],
  },
  {
    name: "Cooking Oils & Ghee",
    slug: "oils-ghee",
    sortOrder: 4,
    products: [
      { name: "Sunflower Oil (Refined)", unit: "1 L", price: 138, mrp: 155 },
      { name: "Groundnut Oil (Filtered)", unit: "1 L", price: 195, mrp: 215 },
      { name: "Coconut Oil", unit: "500 ml", price: 145, mrp: 160 },
      { name: "Castor Oil", unit: "200 ml", price: 55, mrp: 62 },
      { name: "Cow Ghee (Nandini)", unit: "500 ml", price: 320, mrp: 340 },
      { name: "Vanaspati (Dalda)", unit: "500 ml", price: 85, mrp: 95 },
    ],
  },
  {
    name: "Spices & Masala",
    slug: "spices-masala",
    sortOrder: 5,
    products: [
      { name: "Byadagi Red Chilli (Whole)", unit: "250 g", price: 110, mrp: 125 },
      { name: "Red Chilli Powder", unit: "200 g", price: 68, mrp: 78 },
      { name: "Turmeric Powder", unit: "200 g", price: 52, mrp: 60 },
      { name: "Coriander Powder", unit: "200 g", price: 48, mrp: 55 },
      { name: "Jeera (Cumin Seeds)", unit: "100 g", price: 45, mrp: 52 },
      { name: "Mustard Seeds", unit: "200 g", price: 38, mrp: 44 },
      { name: "Sambar Powder (MTR)", unit: "200 g", price: 92, mrp: 102 },
      { name: "Rasam Powder (MTR)", unit: "200 g", price: 92, mrp: 102 },
      { name: "Garam Masala", unit: "100 g", price: 58, mrp: 66 },
      { name: "Tamarind (Seedless)", unit: "500 g", price: 85, mrp: 98 },
    ],
  },
  {
    name: "Sugar, Salt & Jaggery",
    slug: "sugar-salt-jaggery",
    sortOrder: 6,
    products: [
      { name: "Sugar (Crystal)", unit: "1 kg", price: 46, mrp: 52 },
      { name: "Jaggery (Bella, Block)", unit: "1 kg", price: 62, mrp: 70 },
      { name: "Jaggery Powder", unit: "500 g", price: 45, mrp: 52 },
      { name: "Iodised Salt (Tata)", unit: "1 kg", price: 26, mrp: 30 },
      { name: "Rock Salt (Crystal)", unit: "1 kg", price: 38, mrp: 45 },
    ],
  },
  {
    name: "Tea, Coffee & Beverages",
    slug: "tea-coffee",
    sortOrder: 7,
    products: [
      { name: "Tea Powder (Red Label)", unit: "500 g", price: 260, mrp: 285 },
      { name: "Filter Coffee Powder (80:20)", unit: "500 g", price: 310, mrp: 340 },
      { name: "Instant Coffee (Bru)", unit: "100 g", price: 175, mrp: 190 },
      { name: "Horlicks (Classic Malt)", unit: "500 g", price: 265, mrp: 285 },
      { name: "Boost", unit: "500 g", price: 255, mrp: 275 },
    ],
  },
  {
    name: "Dry Fruits & Nuts",
    slug: "dry-fruits-nuts",
    sortOrder: 8,
    products: [
      { name: "Cashew (W320)", unit: "250 g", price: 240, mrp: 270 },
      { name: "Almonds", unit: "250 g", price: 190, mrp: 215 },
      { name: "Raisins (Golden)", unit: "250 g", price: 85, mrp: 98 },
      { name: "Dry Coconut (Copra)", unit: "1 pc", price: 55, mrp: 65 },
      { name: "Dates (Seedless)", unit: "500 g", price: 145, mrp: 165 },
    ],
  },
  {
    name: "Snacks & Biscuits",
    slug: "snacks-biscuits",
    sortOrder: 9,
    products: [
      { name: "Parle-G Gold", unit: "1 kg pack", price: 130, mrp: 145 },
      { name: "Good Day Cashew", unit: "600 g", price: 108, mrp: 120 },
      { name: "Marie Gold", unit: "600 g", price: 82, mrp: 90 },
      { name: "Mixture (Local, Fresh)", unit: "500 g", price: 115, mrp: 130 },
      { name: "Nippattu (Fresh)", unit: "250 g", price: 65, mrp: 75 },
      { name: "Kodubale (Fresh)", unit: "250 g", price: 68, mrp: 78 },
      { name: "Banana Chips", unit: "250 g", price: 72, mrp: 82 },
      { name: "Kurkure Masala Munch", unit: "1 pack (90 g)", price: 20 },
    ],
  },
  {
    name: "Dairy & Bread",
    slug: "dairy-bread",
    sortOrder: 10,
    products: [
      { name: "Nandini Toned Milk", unit: "1 L (2 × 500 ml)", price: 46, mrp: 48 },
      { name: "Nandini Curd", unit: "500 g", price: 26, mrp: 28 },
      { name: "Nandini Butter (Salted)", unit: "100 g", price: 62, mrp: 65 },
      { name: "Paneer (Fresh)", unit: "200 g", price: 88, mrp: 95 },
      { name: "Bread (Sandwich, Large)", unit: "1 loaf (400 g)", price: 42, mrp: 45 },
      { name: "Eggs (Farm Fresh)", unit: "1 tray (12 pcs)", price: 84, mrp: 92 },
    ],
  },
  {
    name: "Vegetables & Fruits",
    slug: "vegetables-fruits",
    sortOrder: 11,
    products: [
      { name: "Onion", unit: "1 kg", price: 32, mrp: 38 },
      { name: "Tomato", unit: "1 kg", price: 28, mrp: 34 },
      { name: "Potato", unit: "1 kg", price: 30, mrp: 36 },
      { name: "Green Chilli", unit: "250 g", price: 18, mrp: 22 },
      { name: "Coriander Leaves", unit: "1 bunch", price: 12, mrp: 15 },
      { name: "Curry Leaves", unit: "1 bunch", price: 8, mrp: 10 },
      { name: "Lemon", unit: "6 pcs", price: 24, mrp: 30 },
      { name: "Banana (Yelakki)", unit: "1 dozen", price: 58, mrp: 68 },
      { name: "Coconut (Fresh)", unit: "1 pc", price: 35, mrp: 42 },
    ],
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    sortOrder: 12,
    products: [
      { name: "Mysore Sandal Soap", unit: "3 × 125 g", price: 135, mrp: 147 },
      { name: "Colgate Strong Teeth", unit: "200 g", price: 108, mrp: 118 },
      { name: "Clinic Plus Shampoo", unit: "340 ml", price: 185, mrp: 205 },
      { name: "Parachute Coconut Hair Oil", unit: "250 ml", price: 118, mrp: 130 },
      { name: "Dettol Antiseptic Liquid", unit: "250 ml", price: 102, mrp: 112 },
      { name: "Santoor Soap", unit: "4 × 100 g", price: 128, mrp: 140 },
    ],
  },
  {
    name: "Household & Cleaning",
    slug: "household-cleaning",
    sortOrder: 13,
    products: [
      { name: "Surf Excel Easy Wash", unit: "1 kg", price: 128, mrp: 140 },
      { name: "Vim Dishwash Bar", unit: "3 × 200 g", price: 58, mrp: 66 },
      { name: "Harpic Toilet Cleaner", unit: "500 ml", price: 92, mrp: 102 },
      { name: "Lizol Floor Cleaner (Citrus)", unit: "975 ml", price: 195, mrp: 215 },
      { name: "Garbage Bags (Medium)", unit: "30 pcs", price: 65, mrp: 75 },
      { name: "Agarbatti (Cycle 3-in-1)", unit: "1 pack", price: 78, mrp: 85 },
      { name: "Camphor (Pure)", unit: "50 g", price: 55, mrp: 62 },
      { name: "Matchbox (Ship)", unit: "10 pcs bundle", price: 18, mrp: 20 },
    ],
  },
];
