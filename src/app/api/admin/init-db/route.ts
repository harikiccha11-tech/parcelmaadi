import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { main as runSeed } from "@/scripts/seed-module";
import fs from "fs";
import path from "path";

// One-time DB init endpoint — protected by INIT_TOKEN env var
// Performs:
//   1. Idempotent schema creation (CREATE TABLE IF NOT EXISTS pattern)
//   2. Seed default data (services, vehicles, admin users, settings, etc.)
// Usage: POST /api/admin/init-db?token=XXX

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function readSchemaSql(): string {
  // Try multiple paths (Vercel may unpack differently)
  // public/ is always deployed as-is, so this is the most reliable location
  const candidates = [
    path.join(process.cwd(), "public", "setup", "schema.sql"),
    path.join(process.cwd(), "scripts", "schema.sql"),
    path.join(process.cwd(), "src", "scripts", "schema.sql"),
    path.join(process.cwd(), "schema.sql"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
    } catch {}
  }
  throw new Error("schema.sql not found in any expected location");
}

export async function POST(request: Request) {
  // Verify token
  const expectedToken = process.env.INIT_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "INIT_TOKEN not configured on server" }, { status: 500 });
  }
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("x-init-token") || "";
  if (token !== expectedToken) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 401 });
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    // Step 1: Apply schema (idempotent — re-running is safe)
    log("→ Applying schema (CREATE TABLE IF NOT EXISTS)...");
    const schemaSql = readSchemaSql();
    // Prisma migrate diff outputs DDL with CREATE TABLE (no IF NOT EXISTS).
    // Wrap statements so re-runs are safe-ish: skip errors that are "already exists".
    const statements = schemaSql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    let applied = 0;
    let skipped = 0;
    for (const stmt of statements) {
      try {
        await db.$executeRawUnsafe(stmt + ";");
        applied++;
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          skipped++;
        } else {
          // Re-throw real errors
          throw new Error(`DDL failed: ${msg}\nStatement: ${stmt.slice(0, 200)}`);
        }
      }
    }
    log(`✓ Schema applied (${applied} statements, ${skipped} skipped as already existing)`);

    // Step 2: Run seed
    log("→ Running seed...");
    await runSeed();
    log("✓ Seed complete");

    return NextResponse.json({
      ok: true,
      message: "Database initialized and seeded successfully",
      details: logs,
    });
  } catch (e: any) {
    console.error("Init failed:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Unknown error",
        details: logs,
      },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}

export async function GET(request: Request) {
  // Health check — does NOT require token
  const url = new URL(request.url);
  if (url.searchParams.get("check") === "1") {
    try {
      const result = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "Service"`);
      const count = Number((result as any)[0]?.count ?? 0);
      return NextResponse.json({
        ok: true,
        initialized: count > 0,
        serviceCount: count,
      });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message || "DB not reachable", initialized: false },
        { status: 200 }
      );
    } finally {
      await db.$disconnect();
    }
  }
  return NextResponse.json({ error: "Method not allowed. Use POST with ?token=XXX" }, { status: 405 });
}
