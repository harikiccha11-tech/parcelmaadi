// Generate PostgreSQL INSERT statements from the seeded local SQLite database.
// Output: /home/z/my-project/scripts/seed-postgres.sql
// The user can paste this into Supabase SQL Editor to seed the production DB.

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import * as fs from "fs";

function sqlVal(v: any): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "string") return `'${v.replace(/'/g, "''")}'`;
  if (typeof v === "number") return v.toString();
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
}

function emitTable(tableName: string, rows: any[]): string {
  if (rows.length === 0) return `-- ${tableName}: empty\n`;
  const cols = Object.keys(rows[0]);
  let out = `-- ${tableName} (${rows.length} rows)\n`;
  out += `DELETE FROM "${tableName}";\n`;
  for (const r of rows) {
    const vals = cols.map((c) => sqlVal(r[c])).join(", ");
    out += `INSERT INTO "${tableName}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${vals});\n`;
  }
  return out + "\n";
}

async function main() {
  console.log("Generating PostgreSQL seed SQL from local SQLite database...");

  // Order matters due to foreign keys — parents first
  // Map of model names (from Prisma) to actual table names in DB
  const tables = [
    "Settings",
    "DomainSettings",
    "Zone",
    "Coupon",
    "Service",
    "Vehicle",
    "Supplier",
    "Product",         // (was "Shop"/"ProductMaster" — actual table name)
    "PriceMaster",
    "ContentSection",
    "SeoSetting",
    "AdminUser",
    "Apk",             // (was "ApkSetting")
    "PasswordReset",   // (no seed data but table exists)
    "Booking",
    "Customer",
    "Payment",
    "StatusHistory",
    "AdminActivity",
    "Waitlist",
  ];

  // For AdminUser, we need to re-hash passwords using scryptSync
  // (SQLite has them as `salt:hash` already, just copy)
  let out = `-- ParcelMaadi seed data for PostgreSQL (Supabase)
-- Generated on: ${new Date().toISOString()}
-- This script is IDEMPOTENT — safe to run multiple times.
-- It wipes existing data in each table before re-inserting.

BEGIN;

SET session_replication_role = 'replica'; -- Disable FK checks during bulk load

`;

  for (const table of tables) {
    try {
      // Prisma's model name maps to table name in schema
      // Use $queryRawUnsafe to fetch all rows
      const rows = await (db as any).$queryRawUnsafe(`SELECT * FROM "${table}"`);
      out += emitTable(table, rows as any[]);
      console.log(`  ✓ ${table}: ${(rows as any[]).length} rows`);
    } catch (e: any) {
      // Table might not exist — skip silently
      console.log(`  ⚠ ${table}: skipped (${e.message.split("\n")[0]})`);
      out += `-- ${table}: skipped (table not found or empty)\n\n`;
    }
  }

  out += `
SET session_replication_role = 'origin'; -- Re-enable FK checks

-- Reset sequences for SERIAL columns (so next INSERT gets correct id)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
    EXECUTE 'SELECT setval(\'' || r.sequence_name || '\', COALESCE((SELECT MAX(id) FROM "' || 
      REPLACE(REPLACE(r.sequence_name, '_id_seq', ''), '"', '') || '"), 0) + 1, false)';
  END LOOP;
END $$;

COMMIT;

-- Done. Admin logins (all password: admin123 — CHANGE BEFORE DEPLOYMENT):
--   admin@parcelmaadi.com (Owner)
--   ops@parcelmaadi.com (Operations)
--   accounts@parcelmaadi.com (Accounts)
--   view@parcelmaadi.com (View-only)
`;

  const outPath = "/home/z/my-project/scripts/seed-postgres.sql";
  fs.writeFileSync(outPath, out);
  console.log(`\n✅ Wrote ${outPath} (${out.length} bytes, ${out.split("\n").length} lines)`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
