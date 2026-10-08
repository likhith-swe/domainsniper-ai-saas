/** Sliding-window in-memory rate limiter for API endpoints. */

type GlobalRl = typeof globalThis & {
  __dsMemRateLimit?: Map<string, number[]>;
};

function buckets(): Map<string, number[]> {
  const g = globalThis as GlobalRl;
  if (!g.__dsMemRateLimit) g.__dsMemRateLimit = new Map();
  return g.__dsMemRateLimit;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const map = buckets();
  const hits = (map.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    map.set(key, hits);
    return { ok: false, remaining: 0, retryAfterMs: windowMs - (now - hits[0]) };
  }
  hits.push(now);
  map.set(key, hits);
  return { ok: true, remaining: limit - hits.length, retryAfterMs: 0 };
}

export function ipFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
