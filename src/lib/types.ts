/** Shared TypeScript contracts for DomainSniper AI. */

export type DropStage = "pending_delete" | "auction" | "closeout" | "expired";

export type DomainCategory =
  | "ai-ml"
  | "fintech"
  | "health"
  | "devtools"
  | "ecommerce";

export interface DomainFlags {
  /** Verified editorial backlinks from .edu / .gov sources. */
  eduGov: boolean;
  /** Historical anchor text contains casino / adult / PBN footprints. */
  spamAnchors: boolean;
  /** Collides with an active registered trademark. */
  trademark: boolean;
}

export interface HistoricalTrend {
  /** Normalized 0-100 search-interest curve, 30 samples over 60 days. */
  interest: number[];
  /** USD minor units valuation tape, 30 samples over 60 days. */
  valuation: number[];
  watchers: number;
  monthlySearches: { month: string; volume: number }[];
}

export interface SniperDomain {
  id: string;
  domainName: string;
  tld: string;
  category: DomainCategory;
  domainRating: number;
  referringDomains: number;
  archiveAgeYears: number;
  dropStage: DropStage;
  /** ISO timestamp of the drop moment. */
  dropEta: string;
  /** Integer minor cents (14500 => $145.00). */
  currentBidUsd: number;
  /** Integer minor cents (120000 => $1,200.00). */
  estValuationUsd: number;
  topBacklinks: string[];
  spamScorePercent: number;
  registrar: string;
  historicalTrend: HistoricalTrend;
  flags: DomainFlags;
}

export interface ScoreBreakdown {
  authority: number;
  backlinks: number;
  age: number;
  brand: number;
  arbitrage: number;
  eduGovBonus: number;
  spamPenalty: number;
  trademarkPenalty: number;
  total: number;
  grade: "S" | "A" | "B" | "C";
  isHighValueSniper: boolean;
}

export interface EnrichedDomain extends SniperDomain {
  score: ScoreBreakdown;
}

export type SortKey =
  | "score"
  | "ending"
  | "price_asc"
  | "price_desc"
  | "dr"
  | "valuation";

export interface DomainFilters {
  tlds?: string[];
  minDr?: number;
  maxPriceUsd?: number;
  q?: string;
  category?: DomainCategory | "all";
  stage?: DropStage | "all";
  sort?: SortKey;
  limit?: number;
  offset?: number;
}

export type AlertChannel = "telegram" | "whatsapp" | "email";

export interface WatchlistRecord {
  id: string;
  userEmail: string;
  name: string;
  tldFilter: string[];
  minDr: number;
  maxPriceUsd: number | null;
  channels: AlertChannel[];
  active: boolean;
  createdAt: string;
}

export interface AlertEvent {
  id: string;
  watchlistId: string | null;
  userEmail: string | null;
  domainId: string;
  domainName?: string;
  channel: AlertChannel;
  status: "sent" | "simulated" | "failed";
  latencyMs: number;
  message: string;
  firedAt: string;
}

export interface Subscription {
  id: string;
  userEmail: string;
  provider: "razorpay" | "stripe" | "sandbox";
  providerSubId: string | null;
  plan: "pro" | "free";
  status: "active" | "canceled" | "past_due";
  amountMinor: number;
  currency: "INR" | "USD";
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface NewsletterSubscriber {
  email: string;
  source: string;
  active: boolean;
  createdAt: string;
}

export interface AffiliateClick {
  id: string;
  domainId: string;
  domainName: string;
  registrar: string;
  userEmail: string | null;
  ipHash: string | null;
  clickedAt: string;
}

export interface Profile {
  email: string;
  displayName: string | null;
  plan: "free" | "pro";
  telegramChatId: string | null;
  whatsappNumber: string | null;
  createdAt: string;
}

export interface SessionUser {
  email: string;
  name?: string;
  plan: "free" | "pro";
  vip: boolean;
  iat: number;
  exp: number;
}

export interface HealthSnapshot {
  ok: boolean;
  db: "postgres" | "memory";
  catalogCount: number;
  uptimeSec: number;
  version: string;
  services: { name: string; status: "configured" | "simulated" }[];
}

export interface DomainListResult {
  items: EnrichedDomain[];
  total: number;
  source: "postgres" | "memory";
  tookMs: number;
}
