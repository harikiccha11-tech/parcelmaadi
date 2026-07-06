// Shared helpers to read admin settings + porter-match config + serviceable-area check
import { db } from "@/lib/db";
import { DEFAULT_PORTER_BANDS, parsePorterBands, type PorterMatchConfig } from "@/lib/fare";

export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db.settings.findMany();
  const m: Record<string, string> = {};
  for (const r of rows) if (r.value != null) m[r.key] = r.value;
  return m;
}

export async function getPorterMatchConfig(commissionPercent?: number): Promise<PorterMatchConfig> {
  const s = await getSettingsMap();
  const enabled = s.porter_match_enabled !== "false";
  const bands = s.porter_match_bands ? parsePorterBands(s.porter_match_bands) : DEFAULT_PORTER_BANDS;
  const floor = Number(s.porter_min_commission_floor || 20);
  return {
    enabled,
    bands,
    minCommissionFloor: Number.isFinite(floor) ? floor : 20,
    commissionPercent: commissionPercent || 0,
  };
}

// Serviceable-area check — customer's address (or pin code) must match one of the
// serviceable areas (city names + pin-code prefixes stored in settings.serviceable_areas)
export async function isServiceable(address: string, pincode?: string): Promise<{ ok: boolean; reason?: string }> {
  const s = await getSettingsMap();
  if (!s.serviceable_areas) return { ok: true }; // no restriction configured
  let areas: string[] = [];
  try { areas = JSON.parse(s.serviceable_areas); } catch { return { ok: true }; }
  if (!Array.isArray(areas) || areas.length === 0) return { ok: true };
  const haystack = `${address || ""} ${pincode || ""}`.toLowerCase();
  for (const a of areas) {
    const token = String(a).toLowerCase().trim();
    if (!token) continue;
    if (haystack.includes(token)) return { ok: true };
  }
  return { ok: false, reason: "Sorry, we don't serve this area yet. Currently servicing Karnataka." };
}

export function extractPincode(text: string): string | null {
  if (!text) return null;
  const m = text.match(/\b(\d{6})\b/);
  return m ? m[1] : null;
}

// Validate 10-digit Indian mobile
export function isValidIndianMobile(mobile: string): boolean {
  const clean = String(mobile || "").replace(/\D/g, "");
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}

// Validate uploaded file type & size
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const ALLOWED_UPLOAD_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
export function validateUpload(file: { name: string; type: string; size: number }, maxMb = 5): { ok: boolean; error?: string } {
  const typeOk = ALLOWED_UPLOAD_TYPES.includes(file.type) || ALLOWED_UPLOAD_EXTS.some((e) => file.name.toLowerCase().endsWith(e));
  if (!typeOk) return { ok: false, error: "Only JPG, PNG, WEBP, PDF files allowed" };
  if (file.size > maxMb * 1024 * 1024) return { ok: false, error: `File too large. Max ${maxMb}MB` };
  return { ok: true };
}

// ---- IST helpers ----
// India is UTC+5:30 with no DST. We compute IST directly from the UTC ms epoch.
const IST_OFFSET_MIN = 330; // 5h 30m

// Returns IST {hour, ...} fields for a given Date. hour is 0-23.
export function getISTParts(d: Date = new Date()) {
  const istMs = d.getTime() + IST_OFFSET_MIN * 60 * 1000;
  const ist = new Date(istMs);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth() + 1,
    day: ist.getUTCDate(),
    hour: ist.getUTCHours(),
    minute: ist.getUTCMinutes(),
  };
}

// Format a Date as an IST timestamp string (locale en-IN)
export function formatIST(d: Date | string = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true });
}

// ---- Night-charge auto-apply ----
// Reads admin-configured night window (night_charge_start_hour / night_charge_end_hour, 24h IST)
// and night_charge_auto_apply toggle. Returns true if the booking time falls in the night window.
export async function isNightChargeActive(bookingDate: Date = new Date()): Promise<boolean> {
  const s = await getSettingsMap();
  if (s.night_charge_auto_apply === "false") return false;
  const startH = Number(s.night_charge_start_hour);
  const endH = Number(s.night_charge_end_hour);
  if (!Number.isFinite(startH) || !Number.isFinite(endH)) return false;
  const hour = getISTParts(bookingDate).hour;
  // Window can wrap midnight, e.g. start=22, end=5 → active if hour>=22 OR hour<5
  if (startH === endH) return false;
  if (startH < endH) return hour >= startH && hour < endH;
  return hour >= startH || hour < endH;
}

