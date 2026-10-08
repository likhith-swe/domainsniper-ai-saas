import { randomUUID } from "node:crypto";
import { eq, gte, isNull, or, sql } from "drizzle-orm";
import { isDbSeeded, markDbSeeded, withDb, type DsDb } from "@/db";
import {
  affiliateClicks,
  alertEvents,
  domains as domainsTable,
  newsletterSubscribers,
  profiles,
  subscriptions,
  systemState,
  userWatchlists,
} from "@/db/schema";
import { getFallbackDomains, synthesizeHistory } from "./fallback-domains";
import { enrich, enrichAll, filterDomains, sortDomains } from "./sniper-score";
import { dispatchAlert } from "./notify";
import { shortEta, usdMinorToDollars } from "./format";
import type {
  AffiliateClick,
  AlertChannel,
  AlertEvent,
  DomainFilters,
  DomainListResult,
  EnrichedDomain,
  HealthSnapshot,
  NewsletterSubscriber,
  Profile,
  SniperDomain,
  Subscription,
  WatchlistRecord,
} from "./types";

/* ------------------------------------------------------------------ */
/* Global in-memory store (offline fallback + hot cache)               */
/* ------------------------------------------------------------------ */

interface MemState {
  watchlists: WatchlistRecord[];
  alerts: AlertEvent[];
  clicks: AffiliateClick[];
  subscribers: Map<string, NewsletterSubscriber>;
  subscriptions: Map<string, Subscription>;
  profiles: Map<string, Profile>;
  state: Map<string, unknown>;
}

type MemGlobal = typeof globalThis & { __dsMem?: MemState };

function mem(): MemState {
  const g = globalThis as MemGlobal;
  if (!g.__dsMem) {
    g.__dsMem = {
      watchlists: [],
      alerts: [],
      clicks: [],
      subscribers: new Map(),
      subscriptions: new Map(),
      profiles: new Map(),
      state: new Map(),
    };
  }
  return g.__dsMem;
}

/* ------------------------------------------------------------------ */
/* Row <-> domain mapping + lazy seeding                               */
/* ------------------------------------------------------------------ */

type DomainRow = typeof domainsTable.$inferSelect;

function rowToDomain(row: DomainRow): SniperDomain {
  return {
    id: row.id,
    domainName: row.domainName,
    tld: row.tld,
    category: row.category as SniperDomain["category"],
    domainRating: row.domainRating,
    referringDomains: row.referringDomains,
    archiveAgeYears: row.archiveAgeYears,
    dropStage: row.dropStage as SniperDomain["dropStage"],
    dropEta: (row.dropEta ?? new Date(Date.now() + 86_400_000)).toISOString(),
    currentBidUsd: row.currentBidUsd,
    estValuationUsd: row.estValuationUsd,
    topBacklinks: row.topBacklinks ?? [],
    spamScorePercent: row.spamScorePercent,
    registrar: row.registrar,
    historicalTrend: row.trend ?? {
      interest: [],
      valuation: [],
      watchers: 0,
      monthlySearches: [],
    },
    flags: row.flags ?? { eduGov: false, spamAnchors: false, trademark: false },
  };
}

function domainToRow(d: SniperDomain) {
  return {
    id: d.id,
    domainName: d.domainName,
    tld: d.tld,
    category: d.category,
    domainRating: d.domainRating,
    referringDomains: d.referringDomains,
    archiveAgeYears: d.archiveAgeYears,
    dropStage: d.dropStage,
    dropEta: new Date(d.dropEta),
    currentBidUsd: d.currentBidUsd,
    estValuationUsd: d.estValuationUsd,
    topBacklinks: d.topBacklinks,
    spamScorePercent: d.spamScorePercent,
    registrar: d.registrar,
    trend: d.historicalTrend,
    flags: d.flags,
  };
}

let seeding: Promise<void> | null = null;

function ensureSeeded(db: DsDb): Promise<void> {
  if (isDbSeeded()) return Promise.resolve();
  if (!seeding) {
    seeding = (async () => {
      try {
        const counted = await db
          .select({ c: sql<number>`count(*)::int` })
          .from(domainsTable);
        const count = Number(counted[0]?.c ?? 0);
        if (count === 0) {
          await db
            .insert(domainsTable)
            .values(getFallbackDomains().map(domainToRow));
        }
        markDbSeeded();
      } catch (err) {
        seeding = null;
        throw err;
      }
    })();
  }
  return seeding;
}

async function fetchAllDomains(): Promise<{
  items: SniperDomain[];
  source: "postgres" | "memory";
}> {
  return withDb(
    () => ({ items: getFallbackDomains(), source: "memory" as const }),
    async (db) => {
      await ensureSeeded(db);
      const rows = await db.select().from(domainsTable);
      if (rows.length === 0) {
        return { items: getFallbackDomains(), source: "memory" as const };
      }
      return { items: rows.map(rowToDomain), source: "postgres" as const };
    },
  );
}

/* ------------------------------------------------------------------ */
/* Domains                                                             */
/* ------------------------------------------------------------------ */

export async function listDomains(
  filters: DomainFilters = {},
): Promise<DomainListResult> {
  const started = Date.now();
  const { items, source } = await fetchAllDomains();
  const enriched = enrichAll(items);
  const filtered = filterDomains(enriched, filters);
  const sorted = sortDomains(filtered, filters.sort ?? "score");
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? 100;
  return {
    items: sorted.slice(offset, offset + limit),
    total: filtered.length,
    source,
    tookMs: Date.now() - started,
  };
}

export async function getDomain(
  id: string,
): Promise<EnrichedDomain | null> {
  const { items } = await fetchAllDomains();
  const found = items.find((d) => d.id === id);
  return found ? enrich(found) : null;
}

export async function getDomainHistory(id: string): Promise<{
  domain: EnrichedDomain | null;
  history: { valuation: number[]; interest: number[]; labels: string[] } | null;
}> {
  const domain = await getDomain(id);
  if (!domain) return { domain: null, history: null };
  return {
    domain,
    history: synthesizeHistory(id, domain.estValuationUsd),
  };
}

/* ------------------------------------------------------------------ */
/* Watchlists (tripwires)                                              */
/* ------------------------------------------------------------------ */

type WatchlistRow = typeof userWatchlists.$inferSelect;

function rowToWatchlist(row: WatchlistRow): WatchlistRecord {
  return {
    id: row.id,
    userEmail: row.userEmail,
    name: row.name,
    tldFilter: row.tldFilter ?? [],
    minDr: row.minDr,
    maxPriceUsd: row.maxPriceUsd,
    channels: (row.channels ?? ["email"]) as AlertChannel[],
    active: row.active,
    createdAt: (row.createdAt ?? new Date()).toISOString(),
  };
}

export async function listWatchlists(email: string): Promise<WatchlistRecord[]> {
  return withDb(
    () =>
      mem()
        .watchlists.filter((w) => w.userEmail === email)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    async (db) => {
      const rows = await db
        .select()
        .from(userWatchlists)
        .where(eq(userWatchlists.userEmail, email));
      return rows.map(rowToWatchlist);
    },
  );
}

async function allWatchlists(): Promise<WatchlistRecord[]> {
  return withDb(
    () => mem().watchlists,
    async (db) => {
      const rows = await db.select().from(userWatchlists);
      return rows.map(rowToWatchlist);
    },
  );
}

export async function createWatchlist(
  input: Omit<WatchlistRecord, "id" | "createdAt">,
): Promise<WatchlistRecord> {
  const record: WatchlistRecord = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return withDb(
    () => {
      mem().watchlists.push(record);
      return record;
    },
    async (db) => {
      await db.insert(userWatchlists).values({
        id: record.id,
        userEmail: record.userEmail,
        name: record.name,
        tldFilter: record.tldFilter,
        minDr: record.minDr,
        maxPriceUsd: record.maxPriceUsd,
        channels: record.channels,
        active: record.active,
        createdAt: new Date(record.createdAt),
      });
      return record;
    },
  );
}

export async function toggleWatchlist(
  id: string,
  email: string,
): Promise<WatchlistRecord | null> {
  return withDb(
    () => {
      const found = mem().watchlists.find(
        (w) => w.id === id && w.userEmail === email,
      );
      if (!found) return null;
      found.active = !found.active;
      return found;
    },
    async (db) => {
      const rows = await db
        .select()
        .from(userWatchlists)
        .where(eq(userWatchlists.id, id));
      const row = rows.find((r) => r.userEmail === email);
      if (!row) return null;
      const nextActive = !row.active;
      await db
        .update(userWatchlists)
        .set({ active: nextActive })
        .where(eq(userWatchlists.id, id));
      return rowToWatchlist({ ...row, active: nextActive });
    },
  );
}

export async function deleteWatchlist(id: string, email: string): Promise<boolean> {
  return withDb(
    () => {
      const store = mem().watchlists;
      const idx = store.findIndex((w) => w.id === id && w.userEmail === email);
      if (idx === -1) return false;
      store.splice(idx, 1);
      return true;
    },
    async (db) => {
      const res = await db
        .delete(userWatchlists)
        .where(eq(userWatchlists.id, id))
        .returning({ userEmail: userWatchlists.userEmail });
      return res.some((r) => r.userEmail === email);
    },
  );
}

/* ------------------------------------------------------------------ */
/* Newsletter                                                          */
/* ------------------------------------------------------------------ */

export async function subscribeNewsletter(
  email: string,
  source: string,
): Promise<{ created: boolean }> {
  const normalized = email.toLowerCase();
  return withDb(
    () => {
      const store = mem().subscribers;
      if (store.has(normalized)) {
        const existing = store.get(normalized)!;
        store.set(normalized, { ...existing, active: true });
        return { created: false };
      }
      store.set(normalized, {
        email: normalized,
        source,
        active: true,
        createdAt: new Date().toISOString(),
      });
      return { created: true };
    },
    async (db) => {
      const inserted = await db
        .insert(newsletterSubscribers)
        .values({ email: normalized, source, active: true })
        .onConflictDoNothing()
        .returning({ email: newsletterSubscribers.email });
      if (inserted.length === 0) {
        await db
          .update(newsletterSubscribers)
          .set({ active: true })
          .where(eq(newsletterSubscribers.email, normalized));
        return { created: false };
      }
      return { created: true };
    },
  );
}

/* ------------------------------------------------------------------ */
/* Affiliate clicks                                                    */
/* ------------------------------------------------------------------ */

export async function recordAffiliateClick(
  input: Omit<AffiliateClick, "id" | "clickedAt">,
): Promise<void> {
  const record: AffiliateClick = {
    ...input,
    id: randomUUID(),
    clickedAt: new Date().toISOString(),
  };
  await withDb(
    () => {
      mem().clicks.push(record);
      if (mem().clicks.length > 2000) mem().clicks.splice(0, 500);
    },
    async (db) => {
      await db.insert(affiliateClicks).values({
        id: record.id,
        domainId: record.domainId,
        domainName: record.domainName,
        registrar: record.registrar,
        userEmail: record.userEmail,
        ipHash: record.ipHash,
        clickedAt: new Date(record.clickedAt),
      });
    },
  );
}

/* ------------------------------------------------------------------ */
/* Alert events                                                        */
/* ------------------------------------------------------------------ */

type AlertRow = typeof alertEvents.$inferSelect;

function rowToAlert(row: AlertRow): AlertEvent {
  return {
    id: row.id,
    watchlistId: row.watchlistId,
    userEmail: row.userEmail,
    domainId: row.domainId,
    domainName: row.domainName,
    channel: row.channel as AlertChannel,
    status: row.status as AlertEvent["status"],
    latencyMs: row.latencyMs,
    message: row.message,
    firedAt: (row.firedAt ?? new Date()).toISOString(),
  };
}

export async function recordAlertEvent(
  input: Omit<AlertEvent, "id" | "firedAt">,
): Promise<AlertEvent> {
  const record: AlertEvent = {
    ...input,
    id: randomUUID(),
    firedAt: new Date().toISOString(),
  };
  return withDb(
    () => {
      mem().alerts.unshift(record);
      if (mem().alerts.length > 1000) mem().alerts.length = 1000;
      return record;
    },
    async (db) => {
      await db.insert(alertEvents).values({
        id: record.id,
        watchlistId: record.watchlistId,
        userEmail: record.userEmail,
        domainId: record.domainId,
        domainName: record.domainName ?? "",
        channel: record.channel,
        status: record.status,
        latencyMs: record.latencyMs,
        message: record.message,
        firedAt: new Date(record.firedAt),
      });
      return record;
    },
  );
}

export async function listAlertEvents(
  email: string,
  limit = 25,
): Promise<AlertEvent[]> {
  return withDb(
    () =>
      mem()
        .alerts.filter((a) => a.userEmail === email || a.userEmail === null)
        .slice(0, limit),
    async (db) => {
      const rows = await db
        .select()
        .from(alertEvents)
        .where(or(eq(alertEvents.userEmail, email), isNull(alertEvents.userEmail)))
        .orderBy(sql`${alertEvents.firedAt} desc`)
        .limit(limit);
      return rows.map(rowToAlert);
    },
  );
}

/* ------------------------------------------------------------------ */
/* Subscriptions                                                       */
/* ------------------------------------------------------------------ */

export async function getSubscription(
  email: string,
): Promise<Subscription | null> {
  const normalized = email.toLowerCase();
  return withDb(
    () => mem().subscriptions.get(normalized) ?? null,
    async (db) => {
      const rows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userEmail, normalized))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        userEmail: row.userEmail,
        provider: row.provider as Subscription["provider"],
        providerSubId: row.providerSubId,
        plan: row.plan as Subscription["plan"],
        status: row.status as Subscription["status"],
        amountMinor: row.amountMinor,
        currency: row.currency as Subscription["currency"],
        currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
        createdAt: (row.createdAt ?? new Date()).toISOString(),
      };
    },
  );
}

export async function upsertSubscription(input: {
  userEmail: string;
  provider: Subscription["provider"];
  providerSubId?: string | null;
  plan?: Subscription["plan"];
  status?: Subscription["status"];
  amountMinor?: number;
  currency?: Subscription["currency"];
  currentPeriodEnd?: string | null;
}): Promise<Subscription> {
  const normalized = input.userEmail.toLowerCase();
  return withDb(
    () => {
      const store = mem().subscriptions;
      const existing = store.get(normalized);
      const next: Subscription = {
        id: existing?.id ?? randomUUID(),
        userEmail: normalized,
        provider: input.provider,
        providerSubId: input.providerSubId ?? existing?.providerSubId ?? null,
        plan: input.plan ?? existing?.plan ?? "pro",
        status: input.status ?? existing?.status ?? "active",
        amountMinor: input.amountMinor ?? existing?.amountMinor ?? 0,
        currency: input.currency ?? existing?.currency ?? "USD",
        currentPeriodEnd:
          input.currentPeriodEnd !== undefined
            ? input.currentPeriodEnd
            : existing?.currentPeriodEnd ?? null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      store.set(normalized, next);
      return next;
    },
    async (db) => {
      const rows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userEmail, normalized))
        .limit(1);
      const existing = rows[0];
      if (existing) {
        const updated = await db
          .update(subscriptions)
          .set({
            provider: input.provider,
            providerSubId: input.providerSubId ?? existing.providerSubId,
            plan: input.plan ?? existing.plan,
            status: input.status ?? existing.status,
            amountMinor: input.amountMinor ?? existing.amountMinor,
            currency: input.currency ?? existing.currency,
            currentPeriodEnd:
              input.currentPeriodEnd !== undefined
                ? input.currentPeriodEnd
                  ? new Date(input.currentPeriodEnd)
                  : null
                : existing.currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existing.id))
          .returning();
        const row = updated[0];
        return {
          id: row.id,
          userEmail: row.userEmail,
          provider: row.provider as Subscription["provider"],
          providerSubId: row.providerSubId,
          plan: row.plan as Subscription["plan"],
          status: row.status as Subscription["status"],
          amountMinor: row.amountMinor,
          currency: row.currency as Subscription["currency"],
          currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
          createdAt: (row.createdAt ?? new Date()).toISOString(),
        };
      }
      const record: Subscription = {
        id: randomUUID(),
        userEmail: normalized,
        provider: input.provider,
        providerSubId: input.providerSubId ?? null,
        plan: input.plan ?? "pro",
        status: input.status ?? "active",
        amountMinor: input.amountMinor ?? 0,
        currency: input.currency ?? "USD",
        currentPeriodEnd: input.currentPeriodEnd ?? null,
        createdAt: new Date().toISOString(),
      };
      await db.insert(subscriptions).values({
        id: record.id,
        userEmail: record.userEmail,
        provider: record.provider,
        providerSubId: record.providerSubId,
        plan: record.plan,
        status: record.status,
        amountMinor: record.amountMinor,
        currency: record.currency,
        currentPeriodEnd: record.currentPeriodEnd
          ? new Date(record.currentPeriodEnd)
          : null,
        createdAt: new Date(record.createdAt),
      });
      return record;
    },
  );
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export async function upsertProfile(
  email: string,
  patch: Partial<Pick<Profile, "displayName" | "plan" | "telegramChatId" | "whatsappNumber">> = {},
): Promise<void> {
  const normalized = email.toLowerCase();
  await withDb(
    () => {
      const store = mem().profiles;
      const existing = store.get(normalized);
      store.set(normalized, {
        email: normalized,
        displayName: patch.displayName ?? existing?.displayName ?? null,
        plan: patch.plan ?? existing?.plan ?? "free",
        telegramChatId:
          patch.telegramChatId ?? existing?.telegramChatId ?? null,
        whatsappNumber: patch.whatsappNumber ?? existing?.whatsappNumber ?? null,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
    },
    async (db) => {
      await db
        .insert(profiles)
        .values({
          email: normalized,
          displayName: patch.displayName ?? null,
          plan: patch.plan ?? "free",
          telegramChatId: patch.telegramChatId ?? null,
          whatsappNumber: patch.whatsappNumber ?? null,
        })
        .onConflictDoUpdate({
          target: profiles.email,
          set: {
            ...(patch.displayName !== undefined
              ? { displayName: patch.displayName }
              : {}),
            ...(patch.plan !== undefined ? { plan: patch.plan } : {}),
            ...(patch.telegramChatId !== undefined
              ? { telegramChatId: patch.telegramChatId }
              : {}),
            ...(patch.whatsappNumber !== undefined
              ? { whatsappNumber: patch.whatsappNumber }
              : {}),
            updatedAt: new Date(),
          },
        });
    },
  );
}

/* ------------------------------------------------------------------ */
/* System state                                                        */
/* ------------------------------------------------------------------ */

export async function setSystemState(key: string, value: unknown): Promise<void> {
  await withDb(
    () => {
      mem().state.set(key, value);
    },
    async (db) => {
      await db
        .insert(systemState)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: systemState.key,
          set: { value, updatedAt: new Date() },
        });
    },
  );
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const { items, source } = await fetchAllDomains();
  const { BILLING, NOTIFY } = await import("./env");
  return {
    ok: true,
    db: source,
    catalogCount: items.length,
    uptimeSec: Math.round(process.uptime()),
    version: "2.1.0",
    services: [
      {
        name: "stripe",
        status: BILLING.stripeConfigured ? "configured" : "simulated",
      },
      {
        name: "razorpay",
        status: BILLING.razorpayConfigured ? "configured" : "simulated",
      },
      {
        name: "telegram",
        status: NOTIFY.telegramConfigured ? "configured" : "simulated",
      },
      {
        name: "whatsapp",
        status: NOTIFY.whatsappConfigured ? "configured" : "simulated",
      },
      {
        name: "resend-email",
        status: NOTIFY.emailConfigured ? "configured" : "simulated",
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Cron: drop refresh + tripwire dispatch                              */
/* ------------------------------------------------------------------ */

function matchesWatchlist(d: EnrichedDomain, wl: WatchlistRecord): boolean {
  if (wl.tldFilter.length > 0 && !wl.tldFilter.includes(d.tld)) return false;
  if (d.domainRating < wl.minDr) return false;
  if (wl.maxPriceUsd !== null && d.currentBidUsd > wl.maxPriceUsd * 100) {
    return false;
  }
  return true;
}

function buildAlertMessage(d: EnrichedDomain): string {
  return `🎯 TRIPWIRE — ${d.domainName} drops ${shortEta(d.dropEta)}\n` +
    `SniperScore ${d.score.total}/100 (grade ${d.score.grade}) · DR ${d.domainRating} · ${d.referringDomains} RDs\n` +
    `Bid ${usdMinorToDollars(d.currentBidUsd)} vs est. ${usdMinorToDollars(d.estValuationUsd)} · stage ${d.dropStage}`;
}

export interface CronResult {
  scanned: number;
  firingWindow: string;
  fired: number;
  simulated: number;
  sent: number;
  events: AlertEvent[];
  ranAt: string;
}

export async function runCronRefresh(): Promise<CronResult> {
  const started = Date.now();
  const { items } = await fetchAllDomains();
  const enriched = enrichAll(items);
  const now = Date.now();
  const windowMs = 6 * 3_600_000;
  const soon = enriched.filter((d) => {
    const ms = new Date(d.dropEta).getTime() - now;
    return ms > 0 && ms < windowMs && d.dropStage !== "expired";
  });

  const dedupe = new Set<string>();
  const cutoff = new Date(Date.now() - windowMs);
  const recent = await withDb(
    () => mem().alerts,
    async (db) => {
      const rows = await db
        .select()
        .from(alertEvents)
        .where(gte(alertEvents.firedAt, cutoff));
      return rows.map(rowToAlert);
    },
  );
  for (const a of recent) {
    dedupe.add(`${a.watchlistId ?? "house"}:${a.domainId}:${a.channel}`);
  }

  const fired: AlertEvent[] = [];
  const watchlists = (await allWatchlists()).filter((w) => w.active);

  for (const wl of watchlists) {
    const matches = soon.filter((d) => matchesWatchlist(d, wl));
    for (const d of matches.slice(0, 5)) {
      const message = buildAlertMessage(d);
      for (const channel of wl.channels) {
        const key = `${wl.id}:${d.id}:${channel}`;
        if (dedupe.has(key)) continue;
        const res = await dispatchAlert(channel, message, wl.userEmail);
        const event = await recordAlertEvent({
          watchlistId: wl.id,
          userEmail: wl.userEmail,
          domainId: d.id,
          domainName: d.domainName,
          channel,
          status: res.ok ? (res.mode === "live" ? "sent" : "simulated") : "failed",
          latencyMs: res.latencyMs,
          message,
        });
        dedupe.add(key);
        fired.push(event);
      }
    }
  }

  // House radar: always surface imminent high-value snipers even without user watchlists.
  const houseTargets = soon
    .filter((d) => d.score.isHighValueSniper)
    .slice(0, 3);
  for (const d of houseTargets) {
    const key = `house:${d.id}:email`;
    if (dedupe.has(key)) continue;
    const message = buildAlertMessage(d);
    const res = await dispatchAlert("email", message);
    const event = await recordAlertEvent({
      watchlistId: null,
      userEmail: null,
      domainId: d.id,
      domainName: d.domainName,
      channel: "email",
      status: res.ok ? (res.mode === "live" ? "sent" : "simulated") : "failed",
      latencyMs: res.latencyMs,
      message,
    });
    dedupe.add(key);
    fired.push(event);
  }

  await setSystemState("cron:last-refresh", {
    at: new Date().toISOString(),
    scanned: items.length,
    fired: fired.length,
    durationMs: Date.now() - started,
  });

  return {
    scanned: items.length,
    firingWindow: "6h",
    fired: fired.length,
    simulated: fired.filter((e) => e.status === "simulated").length,
    sent: fired.filter((e) => e.status === "sent").length,
    events: fired.slice(0, 20),
    ranAt: new Date().toISOString(),
  };
}
