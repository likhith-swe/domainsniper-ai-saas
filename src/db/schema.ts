import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { AlertChannel, DomainFlags, HistoricalTrend } from "@/lib/types";

/** 1/9 — canonical dropping-domain catalog mirrored from the offline dataset. */
export const domains = pgTable("domains", {
  id: text("id").primaryKey(),
  domainName: text("domain_name").notNull().unique(),
  tld: text("tld").notNull(),
  category: text("category").notNull(),
  domainRating: integer("domain_rating").notNull().default(0),
  referringDomains: integer("referring_domains").notNull().default(0),
  archiveAgeYears: integer("archive_age_years").notNull().default(0),
  dropStage: text("drop_stage").notNull().default("pending_delete"),
  dropEta: timestamp("drop_eta", { withTimezone: true }),
  currentBidUsd: integer("current_bid_usd").notNull().default(0),
  estValuationUsd: integer("est_valuation_usd").notNull().default(0),
  topBacklinks: jsonb("top_backlinks").$type<string[]>().notNull().default([]),
  spamScorePercent: integer("spam_score_percent").notNull().default(0),
  registrar: text("registrar").notNull().default(""),
  trend: jsonb("trend").$type<HistoricalTrend>(),
  flags: jsonb("flags").$type<DomainFlags>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 2/9 — archived authority backlinks per domain. */
export const backlinkHistory = pgTable("backlink_history", {
  id: text("id").primaryKey(),
  domainId: text("domain_id")
    .notNull()
    .references(() => domains.id, { onDelete: "cascade" }),
  sourceDomain: text("source_domain").notNull(),
  sourceUrl: text("source_url"),
  anchor: text("anchor"),
  sourceDr: integer("source_dr").notNull().default(0),
  isEduGov: boolean("is_edu_gov").notNull().default(false),
  firstSeen: timestamp("first_seen", { withTimezone: true }).defaultNow(),
});

/** 3/9 — user profiles keyed by magic-link email. */
export const profiles = pgTable("profiles", {
  email: text("email").primaryKey(),
  displayName: text("display_name"),
  plan: text("plan").notNull().default("free"),
  telegramChatId: text("telegram_chat_id"),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 4/9 — tripwire watchlists. */
export const userWatchlists = pgTable("user_watchlists", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  name: text("name").notNull(),
  tldFilter: jsonb("tld_filter").$type<string[]>().notNull().default([]),
  minDr: integer("min_dr").notNull().default(0),
  maxPriceUsd: integer("max_price_usd"),
  channels: jsonb("channels").$type<AlertChannel[]>().notNull().default(["email"]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** 5/9 — dual-currency subscriptions. */
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  provider: text("provider").notNull(),
  providerSubId: text("provider_sub_id"),
  plan: text("plan").notNull().default("pro"),
  status: text("status").notNull().default("active"),
  amountMinor: integer("amount_minor").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** 6/9 — outbound registrar click tracking. */
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: text("id").primaryKey(),
  domainId: text("domain_id").notNull(),
  domainName: text("domain_name").notNull().default(""),
  registrar: text("registrar").notNull().default(""),
  userEmail: text("user_email"),
  ipHash: text("ip_hash"),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).defaultNow(),
});

/** 7/9 — morning drop-digest subscribers. */
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  email: text("email").primaryKey(),
  source: text("source").notNull().default("footer"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** 8/9 — every tripwire alert fired, with delivery latency. */
export const alertEvents = pgTable("alert_events", {
  id: text("id").primaryKey(),
  watchlistId: text("watchlist_id"),
  userEmail: text("user_email"),
  domainId: text("domain_id").notNull(),
  domainName: text("domain_name").notNull().default(""),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("simulated"),
  latencyMs: integer("latency_ms").notNull().default(0),
  message: text("message").notNull().default(""),
  firedAt: timestamp("fired_at", { withTimezone: true }).defaultNow(),
});

/** 9/9 — free-form system state (cron heartbeats, feature flags). */
export const systemState = pgTable("system_state", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
