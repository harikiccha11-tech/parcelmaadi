// ParcelMaadi — Product Price Master Seed
//
// Reads the Excel file at /home/z/my-project/upload/parcelmaadi_product_master_with_image_links.xlsx
// (121 products across 7 categories) using Python + openpyxl via subprocess, then upserts each
// row into the Product table with all fields from the spreadsheet.
//
// FORMULA: ParcelMaadi Selling Price = Supplier Price + (Supplier Price × Margin%) + Handling/Delivery Fee
// (We store the spreadsheet's ParcelMaadi Price as the sellingPrice; recompute is left to the admin UI.)
//
// Match policy: upsert by (productName + brand + unit). If a product with the same name + brand +
// unit already exists, update it; otherwise create a new one.
//
// Usage:  bun run scripts/seed-product-master.ts
import { db } from "@/lib/db";

const XLSX_PATH = "/home/z/my-project/upload/parcelmaadi_product_master_with_image_links.xlsx";

// Python script that loads the xlsx with openpyxl and prints rows as JSON to stdout.
// Using a subprocess keeps the heavy xlsx parsing off the Bun runtime (no xlsx npm dep needed).
const PYTHON_SCRIPT = `
import openpyxl, json, sys, datetime

wb = openpyxl.load_workbook(${JSON.stringify(XLSX_PATH)}, data_only=True)
ws = wb.active
headers = [str(c.value or "").strip() for c in ws[1]]
rows = []
for r in range(2, ws.max_row + 1):
    row = {}
    for ci, h in enumerate(headers, start=1):
        v = ws.cell(r, ci).value
        if isinstance(v, datetime.datetime):
            v = v.date().isoformat()
        elif isinstance(v, datetime.date):
            v = v.isoformat()
        elif v is None:
            v = ""
        row[h] = v
    # Skip fully empty rows
    if any(str(v).strip() for v in row.values()):
        rows.append(row)
print(json.dumps(rows, ensure_ascii=False))
`;

interface ExcelRow {
  Category?: string;
  Subcategory?: string;
  "Product Name"?: string;
  "Brand/Type"?: string;
  Unit?: string;
  "MRP ₹"?: string | number;
  "Market Low ₹"?: string | number;
  "Market High ₹"?: string | number;
  "ParcelMaadi Price ₹"?: string | number;
  "Supplier Price ₹"?: string | number;
  "Margin %"?: string | number;
  "GST %"?: string | number;
  "Stock Status"?: string;
  City?: string;
  Pincode?: string;
  "Image URL"?: string;
  "Source/Notes"?: string;
  "Last Updated"?: string;
}

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(String(v).replace(/[₹,\\s]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Accept YYYY-MM-DD or full ISO; fall back to Date.parse
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

async function readExcelRows(): Promise<ExcelRow[]> {
  const proc = Bun.spawn(["python3", "-c", PYTHON_SCRIPT], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  if (exitCode !== 0) {
    console.error("Python subprocess failed (exit", exitCode + "):", stderr);
    throw new Error("Failed to read xlsx via python subprocess");
  }
  try {
    return JSON.parse(stdout);
  } catch (e) {
    console.error("Failed to parse python stdout as JSON. First 500 chars:", stdout.slice(0, 500));
    throw e;
  }
}

async function main() {
  console.log("📦 ParcelMaadi Product Price Master Seed");
  console.log("Reading xlsx:", XLSX_PATH);

  const rows = await readExcelRows();
  console.log(`Parsed ${rows.length} rows from Excel.`);

  // Find the ParcelMaadi Grocery Hub supplier (fallback: first supplier of type 'grocery')
  const hubSupplier =
    (await db.supplier.findFirst({
      where: { OR: [
        { shopName: "ParcelMaadi Grocery Hub" },
        { supplierName: "ParcelMaadi Grocery Hub" },
      ] },
    })) ||
    (await db.supplier.findFirst({ where: { supplierType: "grocery" } })) ||
    (await db.supplier.findFirst());

  if (!hubSupplier) {
    throw new Error("No supplier found. Run `bun run scripts/seed.ts` first to create suppliers.");
  }
  console.log(`Using supplier: id=${hubSupplier.id} name=${hubSupplier.shopName || hubSupplier.supplierName}`);

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const productName = str(r["Product Name"]);
    if (!productName) {
      errors.push(`Row ${i + 2}: missing Product Name — skipped`);
      continue;
    }
    const brand = str(r["Brand/Type"]);
    const unit = str(r["Unit"]);

    const data = {
      supplierId: hubSupplier.id,
      category: str(r["Category"]),
      subcategory: str(r["Subcategory"]),
      productName,
      brand,
      packSize: unit, // packSize mirrors Unit so existing UI code keeps working
      unit,
      mrp: num(r["MRP ₹"]),
      marketLowPrice: num(r["Market Low ₹"]),
      marketHighPrice: num(r["Market High ₹"]),
      supplierPrice: num(r["Supplier Price ₹"]),
      sellingPrice: num(r["ParcelMaadi Price ₹"]),
      marginPercent: num(r["Margin %"], 10),
      gstPercent: num(r["GST %"], 5),
      handlingFee: 0,
      priceSource: str(r["Source/Notes"]),
      photoUrl: str(r["Image URL"]),
      status: str(r["Stock Status"]) || "Active",
      city: str(r["City"]),
      pincode: str(r["Pincode"]),
      lastUpdated: parseDate(r["Last Updated"]),
    };

    // Upsert by (productName + brand + unit) unique tuple
    const existing = await db.product.findFirst({
      where: {
        productName,
        brand: brand ?? null,
        unit: unit ?? null,
      },
    });

    if (existing) {
      await db.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await db.product.create({ data });
      created++;
    }
  }

  console.log("");
  console.log("✅ Seed complete.");
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors : ${errors.length}`);
  if (errors.length) {
    console.log("   Error details:");
    for (const e of errors) console.log("   -", e);
  }

  const total = await db.product.count();
  console.log(`   Total products in DB now: ${total}`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("Seed failed:", e);
  await db.$disconnect();
  process.exit(1);
});
