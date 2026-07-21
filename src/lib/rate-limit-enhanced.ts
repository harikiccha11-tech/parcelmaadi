const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMITS: Record<string, number> = { booking: 5, login: 10, default: 60 };
const requests = new Map<string, { count: number; resetTime: number }>();
export function checkRateLimit(ip: string, endpoint: string): { ok: boolean; retryAfterSec?: number } {
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = `${ip}:${endpoint}`; const now = Date.now();
  const record = requests.get(key);
  if (!record || now > record.resetTime) { requests.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW }); return { ok: true }; }
  if (record.count >= limit) return { ok: false, retryAfterSec: Math.ceil((record.resetTime - now) / 1000) };
  record.count++; return { ok: true };
}
export function getClientIp(req: Request): string {
  const headers = new Headers(req.headers);
  return headers.get("x-forwarded-for")?.split(",")[0] || headers.get("x-real-ip") || "unknown";
}
