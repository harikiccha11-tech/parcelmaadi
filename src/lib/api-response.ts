import { NextResponse } from "next/server";
export function successResponse(data: any, status = 200) { return NextResponse.json({ ok: true, ...data }, { status }); }
export function errorResponse(message: string, status = 500, details?: any) { return NextResponse.json({ ok: false, error: message, details }, { status }); }
export function paginatedResponse(items: any[], total: number, page: number, limit: number) {
  return NextResponse.json({ ok: true, items, total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total });
}
export function safeJsonParse(str: string | null): any { if (!str) return null; try { return JSON.parse(str); } catch { return null; } }
export function validateRequired(body: any, fields: string[]): string | null {
  for (const f of fields) { if (!body[f] || (typeof body[f] === "string" && !body[f].trim())) return `${f} is required`; }
  return null;
}
