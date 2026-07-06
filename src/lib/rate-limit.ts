// In-memory rate limiter (per-IP / per-key). Resets every minute window.
//
// IMPORTANT LIMITATION: This in-memory limiter does NOT reliably persist across
// Vercel serverless invocations. Each cold-start or warm instance may have its
// own independent bucket. It still helps as a best-effort layer on warm instances
// (which handle most traffic), but determined attackers could bypass it by
// triggering cold starts.
//
// For true distributed rate limiting on Vercel, use Upstash Redis or Vercel KV.
// The current implementation is intentionally kept simple and does NOT claim to
// be "safe for serverless" — it is a best-effort layer only.

interface RateBucket {
  count: number;
  resetAt: number; // ms epoch
}

const buckets = new Map<string, RateBucket>();

// periodic cleanup
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }, 60_000).unref?.();
}

export function rateLimit(key: string, maxPerMinute: number): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return { ok: true, remaining: maxPerMinute - 1, retryAfterSec: 60 };
  }
  if (existing.count >= maxPerMinute) {
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { ok: true, remaining: maxPerMinute - existing.count, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
}

// Extract client IP from request headers (works behind proxies/Vercel)
export function getClientIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
