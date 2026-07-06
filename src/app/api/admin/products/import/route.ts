import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// POST /api/admin/products/import
// Accepts multipart/form-data with:
//   - file:        CSV file (required)
//   - supplierId:  optional number (defaults to first grocery / first supplier)
//
// CSV columns (header row required, case-insensitive, matches the Excel layout):
//   Category, Subcategory, Product Name, Brand/Type, Unit, MRP, Market Low, Market High,
//   ParcelMaadi Price, Supplier Price, Margin %, GST %, Stock Status, City, Pincode, Image URL
//
// For each row, upsert product matched by (productName + brand + unit).
// Returns { imported: N, updated: N, errors: [...] }

// ── Minimal RFC-4180 CSV parser (handles quoted fields, embedded commas/newlines, "" escapes) ──
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  // Flush trailing field/row
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  // Drop trailing empty rows
  while (rows.length && rows[rows.length - 1].every((c) => c.trim() === "")) rows.pop();
  return rows;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

// Map of normalized CSV header → canonical field key
const HEADER_MAP: Record<string, string> = {
  category: "category",
  subcategory: "subcategory",
  productname: "productName",
  product: "productName",
  name: "productName",
  brandtype: "brand",
  brand: "brand",
  type: "brand",
  unit: "unit",
  packsize: "unit",
  mrp: "mrp",
  marketlow: "marketLowPrice",
  marketlowprice: "marketLowPrice",
  markethigh: "marketHighPrice",
  markethighprice: "marketHighPrice",
  parcelmaadiprice: "sellingPrice",
  parcelmaadi: "sellingPrice",
  sellingprice: "sellingPrice",
  supplierprice: "supplierPrice",
  margin: "marginPercent",
  marginpercent: "marginPercent",
  gst: "gstPercent",
  gstpercent: "gstPercent",
  stockstatus: "status",
  stock: "status",
  city: "city",
  pincode: "pincode",
  imageurl: "photoUrl",
  image: "photoUrl",
  photo: "photoUrl",
  photourl: "photoUrl",
};

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const s = String(v).replace(/[₹,\s%]/g, "");
  if (s === "") return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with a CSV file." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'file' field (CSV)." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
  }
  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV has no data rows." }, { status: 400 });
  }

  // Build header index
  const headers = rows[0].map(normalizeHeader);
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    const canon = HEADER_MAP[h];
    if (canon && !(canon in colIndex)) colIndex[canon] = i;
  });

  if (colIndex.productName === undefined) {
    return NextResponse.json(
      { error: "CSV must contain a 'Product Name' column." },
      { status: 400 },
    );
  }

  // Resolve supplierId: form field > ParcelMaadi Grocery Hub > first grocery supplier > first supplier
  let supplierId: number | null = null;
  const formSupplierId = form.get("supplierId");
  if (formSupplierId) {
    supplierId = Number(formSupplierId);
    if (!Number.isFinite(supplierId) || supplierId <= 0) {
      return NextResponse.json({ error: "Invalid supplierId." }, { status: 400 });
    }
  } else {
    const hub =
      (await db.supplier.findFirst({
        where: { OR: [
          { shopName: "ParcelMaadi Grocery Hub" },
          { supplierName: "ParcelMaadi Grocery Hub" },
        ] },
      })) ||
      (await db.supplier.findFirst({ where: { supplierType: "grocery" } })) ||
      (await db.supplier.findFirst());
    if (!hub) {
      return NextResponse.json({ error: "No supplier exists. Create one first." }, { status: 400 });
    }
    supplierId = hub.id;
  }

  // Read default handling fee from settings (default 0)
  const handlingSetting = await db.settings.findUnique({ where: { key: "handling_fee_default" } });
  const defaultHandlingFee = handlingSetting?.value ? Number(handlingSetting.value) || 0 : 0;

  let imported = 0;   // newly created
  let updated = 0;    // existing rows updated
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (key: string): string | undefined => {
      const idx = colIndex[key];
      return idx === undefined ? undefined : cells[idx]?.trim();
    };

    const productName = str(get("productName"));
    if (!productName) {
      errors.push(`Row ${r + 1}: missing Product Name — skipped`);
      continue;
    }
    const brand = str(get("brand"));
    const unit = str(get("unit"));

    try {
      const data = {
        supplierId,
        category: str(get("category")),
        subcategory: str(get("subcategory")),
        productName,
        brand,
        packSize: unit,
        unit,
        mrp: num(get("mrp")),
        marketLowPrice: num(get("marketLowPrice")),
        marketHighPrice: num(get("marketHighPrice")),
        supplierPrice: num(get("supplierPrice")),
        sellingPrice: num(get("sellingPrice")),
        marginPercent: num(get("marginPercent"), 10),
        gstPercent: num(get("gstPercent"), 5),
        handlingFee: defaultHandlingFee,
        photoUrl: str(get("photoUrl")),
        status: str(get("status")) || "Active",
        city: str(get("city")),
        pincode: str(get("pincode")),
        lastUpdated: new Date(),
      };

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
        imported++;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Row ${r + 1} (${productName}): ${msg}`);
    }
  }

  return NextResponse.json({ imported, updated, errors, total: rows.length - 1 });
}
