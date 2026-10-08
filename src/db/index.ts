import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type DsDb = NodePgDatabase<typeof schema>;

type GlobalWithDb = typeof globalThis & {
  __dsDbPool?: Pool;
  __dsDb?: DsDb;
  __dsDbFailedAt?: number;
  __dsDbSeeded?: boolean;
};

const g = globalThis as GlobalWithDb;

const NEGATIVE_CACHE_MS = 30_000;
const CONNECT_TIMEOUT_MS = 2_500;

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return typeof url === "string" && url.trim().length > 0;
}

/** During `next build` we never touch the network — offline resilience first. */
function inBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Resilient connection accessor. Returns `null` when DATABASE_URL is missing,
 * when the pool cannot connect within the timeout, or during build. Failures
 * are negatively cached so we never hammer a dead database.
 */
export async function getDb(): Promise<DsDb | null> {
  if (!isDatabaseConfigured() || inBuildPhase()) return null;
  if (g.__dsDb) return g.__dsDb;
  if (g.__dsDbFailedAt && Date.now() - g.__dsDbFailedAt < NEGATIVE_CACHE_MS) {
    return null;
  }
  try {
    if (!g.__dsDbPool) {
      g.__dsDbPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
        idleTimeoutMillis: 30_000,
      });
      // Never let an idle-client error crash the server.
      g.__dsDbPool.on("error", () => undefined);
    }
    const client = await Promise.race([
      g.__dsDbPool.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("ds-db-connect-timeout")),
          CONNECT_TIMEOUT_MS,
        ),
      ),
    ]);
    try {
      await client.query("select 1");
    } finally {
      client.release();
    }
    g.__dsDb = drizzle(g.__dsDbPool, { schema });
    return g.__dsDb;
  } catch {
    g.__dsDbFailedAt = Date.now();
    return null;
  }
}

/**
 * Unified data-access wrapper. Runs `run` against Postgres when healthy,
 * otherwise transparently falls back to the in-memory/offline implementation.
 */
export async function withDb<T>(
  fallback: () => Promise<T> | T,
  run: (db: DsDb) => Promise<T>,
): Promise<T> {
  const db = await getDb();
  if (!db) return await fallback();
  try {
    return await run(db);
  } catch {
    g.__dsDbFailedAt = Date.now();
    return await fallback();
  }
}

export function isDbSeeded(): boolean {
  return Boolean(g.__dsDbSeeded);
}

export function markDbSeeded(): void {
  g.__dsDbSeeded = true;
}

export function invalidateDbCache(): void {
  g.__dsDbFailedAt = undefined;
}

export { schema };
