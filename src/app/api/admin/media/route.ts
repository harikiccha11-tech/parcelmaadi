import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

// POST /api/admin/media/upload — upload image
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: "Type not allowed" }, { status: 400 });

    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 8 MB)" }, { status: 400 });

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

    const ext = file.name.split(".").pop() || "jpg";
    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now()}-${hash}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    return NextResponse.json({
      ok: true,
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      type: file.type,
      originalName: file.name,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}

// GET /api/admin/media — list media
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) return NextResponse.json({ items: [] });

    const files = await readdir(uploadsDir);
    const items: { filename: string; url: string; size: number; createdAt: Date }[] = [];
    for (const filename of files.slice(-100)) {
      const filepath = path.join(uploadsDir, filename);
      const s = await stat(filepath);
      items.push({ filename, url: `/uploads/${filename}`, size: s.size, createdAt: s.mtime });
    }
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ items, count: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
