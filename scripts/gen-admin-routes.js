#!/usr/bin/env node
/**
 * Bulk-generate admin API route files for all new modules.
 * Each module gets: GET (list), POST (create), and [id]/route.ts with PATCH (update) + DELETE (archive).
 */
const fs = require("fs");
const path = require("path");

const ROOT = "/home/z/my-project/src/app/api/admin";

// Module definitions
const MODULES = [
  {
    name: "riders",
    model: "rider",
    label: "Rider",
    createFields: ["name", "mobile", "email", "city", "vehicleType", "vehicleNumber", "drivingLicense", "aadhaar", "address", "zoneId", "photoUrl"],
    updateFields: ["name", "mobile", "email", "city", "vehicleType", "vehicleNumber", "drivingLicense", "aadhaar", "address", "zoneId", "photoUrl", "currentLat", "currentLng", "isOnline", "isVerified", "rating", "status", "archived"],
  },
  {
    name: "branches",
    model: "branch",
    label: "Branch",
    createFields: ["name", "code", "address", "city", "pincode", "mobile", "email", "managerName", "managerMobile", "lat", "lng", "zoneId"],
    updateFields: ["name", "code", "address", "city", "pincode", "mobile", "email", "managerName", "managerMobile", "lat", "lng", "zoneId", "status", "archived"],
  },
  {
    name: "categories",
    model: "category",
    label: "Category",
    createFields: ["name", "slug", "parentId", "icon", "imageUrl", "sortOrder"],
    updateFields: ["name", "slug", "parentId", "icon", "imageUrl", "sortOrder", "status", "archived"],
  },
  {
    name: "cities",
    model: "city",
    label: "City",
    createFields: ["name", "state", "code", "lat", "lng"],
    updateFields: ["name", "state", "code", "lat", "lng", "status", "archived"],
  },
  {
    name: "offers",
    model: "offer",
    label: "Offer",
    createFields: ["title", "description", "offerType", "value", "minOrderAmount", "maxDiscount", "applicableServices", "startDate", "endDate", "usageLimit"],
    updateFields: ["title", "description", "offerType", "value", "minOrderAmount", "maxDiscount", "applicableServices", "startDate", "endDate", "usageLimit", "status"],
  },
  {
    name: "wallets",
    model: "wallet",
    label: "Wallet",
    createFields: ["holderType", "holderId"],
    updateFields: ["status"],
  },
  {
    name: "settlements",
    model: "settlement",
    label: "Settlement",
    createFields: ["riderId", "vendorId", "periodStart", "periodEnd", "totalRides", "grossAmount", "commission", "netAmount", "notes"],
    updateFields: ["riderId", "vendorId", "periodStart", "periodEnd", "totalRides", "grossAmount", "commission", "netAmount", "status", "paidAt", "utr", "notes"],
  },
  {
    name: "audit-logs",
    model: "auditLog",
    label: "AuditLog",
    createFields: [],
    updateFields: [],
    readOnly: true,
  },
  {
    name: "feature-flags",
    model: "featureFlag",
    label: "FeatureFlag",
    createFields: ["key", "label", "description", "enabled", "rolloutPercent"],
    updateFields: ["key", "label", "description", "enabled", "rolloutPercent"],
  },
  {
    name: "api-keys",
    model: "apiKey",
    label: "ApiKey",
    createFields: ["name", "scopes", "expiresAt", "createdBy"],
    updateFields: ["name", "scopes", "expiresAt", "status"],
  },
  {
    name: "integrations",
    model: "integration",
    label: "Integration",
    createFields: ["name", "category", "configJson", "status", "notes"],
    updateFields: ["name", "category", "configJson", "status", "notes"],
  },
  {
    name: "banners",
    model: "banner",
    label: "Banner",
    createFields: ["title", "subtitle", "imageUrl", "linkUrl", "position", "startDate", "endDate", "sortOrder"],
    updateFields: ["title", "subtitle", "imageUrl", "linkUrl", "position", "startDate", "endDate", "sortOrder", "status"],
  },
  {
    name: "notifications",
    model: "notificationLog",
    label: "NotificationLog",
    createFields: ["channel", "recipient", "subject", "body", "status", "error", "meta"],
    updateFields: ["status", "error"],
    readOnly: true,
  },
  {
    name: "support",
    model: "supportTicket",
    label: "SupportTicket",
    createFields: ["subject", "description", "customerId", "bookingId", "channel", "priority", "assignedTo"],
    updateFields: ["subject", "description", "customerId", "bookingId", "channel", "priority", "status", "assignedTo", "resolution"],
  },
];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function routeList(module) {
  const modelName = module.model;
  return `import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/${module.name} — list all ${module.label}s
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const url = new URL(req.url);
    const archived = url.searchParams.get("archived") === "true";
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q");
    const limit = Number(url.searchParams.get("limit") || 200);

    const where: any = {};
    if ("archived" in db.${modelName}.fields) where.archived = archived;
    if (status && "status" in db.${modelName}.fields) where.status = status;
    ${module.searchField ? `if (q) where.${module.searchField} = { contains: q, mode: "insensitive" };` : ""}

    const items = await db.${modelName}.findMany({
      where,
      orderBy: { ${module.orderBy || "id"}: "desc" },
      take: limit,
    });
    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch" }, { status: 500 });
  }
}

${module.readOnly ? "" : `// POST /api/admin/${module.name} — create
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const body = await req.json();
    const allowed = ${JSON.stringify(module.createFields)};
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }
    const item = await db.${modelName}.create({ data });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create failed" }, { status: 500 });
  }
}`}
`;
}

function routeId(module) {
  const modelName = module.model;
  return `import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/${module.name}/{id}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ${JSON.stringify(module.updateFields)};
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }
    const item = await db.${modelName}.update({ where: { id: Number(id) }, data });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Update failed" }, { status: 500 });
  }
}

// DELETE /api/admin/${module.name}/{id} — soft delete (archive) or hard delete
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.admin.role === "View") return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const hard = url.searchParams.get("hard") === "true";

    // Try archive first (if model supports it)
    if (!hard) {
      try {
        const item = await db.${modelName}.update({ where: { id: Number(id) }, data: { archived: true } });
        return NextResponse.json({ ok: true, archived: true, item });
      } catch {
        // fall through to hard delete
      }
    }
    await db.${modelName}.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Delete failed" }, { status: 500 });
  }
}
`;
}

let created = 0;
for (const m of MODULES) {
  const dir = path.join(ROOT, m.name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "route.ts"), routeList(m));
  fs.mkdirSync(path.join(dir, "[id]"), { recursive: true });
  fs.writeFileSync(path.join(dir, "[id]", "route.ts"), routeId(m));
  created += 2;
  console.log(`  ✅ ${m.name}/route.ts + [id]/route.ts`);
}
console.log(`\n✅ Created ${created} route files`);
