// ParcelMaadi — Add margin default settings
//
// Upserts category-wise margin min/max defaults + default handling fee into the Settings table.
// Admin UI can later edit these via the existing Settings endpoint.
//
// FORMULA: Selling Price = Supplier Price + (Supplier Price × Margin%) + Handling/Delivery Fee
//
// Usage:  bun run scripts/add-margin-settings.ts
import { db } from "@/lib/db";

const MARGIN_SETTINGS: Array<{ key: string; value: string; type: string }> = [
  // Grocery: 5–12%
  { key: "margin_grocery_min", value: "5", type: "number" },
  { key: "margin_grocery_max", value: "12", type: "number" },
  // Vegetables/Fruits (fresh): 10–20%
  { key: "margin_fresh_min", value: "10", type: "number" },
  { key: "margin_fresh_max", value: "20", type: "number" },
  // Cleaning / Personal Care: 8–15%
  { key: "margin_cleaning_min", value: "8", type: "number" },
  { key: "margin_cleaning_max", value: "15", type: "number" },
  // Construction Material: 3–8%
  { key: "margin_construction_min", value: "3", type: "number" },
  { key: "margin_construction_max", value: "8", type: "number" },
  // Hardware / Electrical: 8–18%
  { key: "margin_hardware_min", value: "8", type: "number" },
  { key: "margin_hardware_max", value: "18", type: "number" },
  // Emergency Order Extra: 10–20%
  { key: "margin_emergency_min", value: "10", type: "number" },
  { key: "margin_emergency_max", value: "20", type: "number" },
  // Default handling / delivery fee
  { key: "handling_fee_default", value: "0", type: "number" },
];

async function main() {
  console.log("⚙️  ParcelMaadi — Margin Settings Seed");
  let upserted = 0;
  for (const s of MARGIN_SETTINGS) {
    await db.settings.upsert({
      where: { key: s.key },
      update: { value: s.value, type: s.type },
      create: { key: s.key, value: s.value, type: s.type },
    });
    upserted++;
    console.log(`  ✓ ${s.key} = ${s.value}`);
  }
  console.log("");
  console.log(`✅ ${upserted} margin settings upserted.`);

  const all = await db.settings.findMany({
    where: { OR: [
      { key: { startsWith: "margin_" } },
      { key: "handling_fee_default" },
    ] },
    orderBy: { key: "asc" },
  });
  console.log("Current margin-related settings:");
  for (const s of all) console.log(`  ${s.key.padEnd(30)} = ${s.value}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Failed:", e);
  await db.$disconnect();
  process.exit(1);
});
