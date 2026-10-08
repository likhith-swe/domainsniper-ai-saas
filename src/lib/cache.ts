/** Tiny in-memory LRU + TTL cache used for API responses and negative caching. */

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class TtlCache<V> {
  private map = new Map<string, CacheEntry<V>>();

  constructor(private readonly maxEntries = 256) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // refresh LRU position
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V, ttlMs: number): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }
}

type GlobalCache = typeof globalThis & {
  __dsMemResponseCache?: TtlCache<unknown>;
};

/** Process-wide response cache (survives HMR in dev via globalThis). */
export function responseCache(): TtlCache<unknown> {
  const g = globalThis as GlobalCache;
  if (!g.__dsMemResponseCache) g.__dsMemResponseCache = new TtlCache<unknown>(512);
  return g.__dsMemResponseCache;
}
