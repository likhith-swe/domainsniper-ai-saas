import type {
  DomainCategory,
  DropStage,
  HistoricalTrend,
  SniperDomain,
} from "./types";

/**
 * Verified 30-domain offline catalog. This dataset is the single source of
 * truth whenever PostgreSQL is unreachable, so the entire product boots,
 * pre-renders and runs with zero database connectivity.
 *
 * Seed tuple:
 * [id, domainName, tld, category, dr, referringDomains, archiveAgeYears,
 *  dropStage, etaMinutes, currentBidUsd(minor), estValuationUsd(minor),
 *  topBacklinks, spamScorePercent, registrar, flagString, watchers]
 *
 * flagString: e = .edu/.gov editorial links, s = spam anchor history,
 *             t = active trademark collision
 */
type Seed = readonly [
  string,
  string,
  string,
  DomainCategory,
  number,
  number,
  number,
  DropStage,
  number,
  number,
  number,
  readonly string[],
  number,
  string,
  string,
  number,
];

const SEEDS: Seed[] = [
  // ---- 1. AI & Machine Learning ----
  ["neuralmatrix-ai", "neuralmatrix.ai", ".ai", "ai-ml", 72, 2140, 11, "pending_delete", 95, 14500, 1850000, ["wikipedia.org", "techcrunch.com", "stanford.edu", "arxiv.org"], 1, "Dynadot", "e", 388],
  ["vectorcache-io", "vectorcache.io", ".io", "ai-ml", 64, 980, 7, "auction", 320, 8800, 620000, ["github.com", "news.ycombinator.com", "medium.com"], 0, "Porkbun", "", 214],
  ["promptforge-ai", "promptforge.ai", ".ai", "ai-ml", 58, 640, 4, "pending_delete", 180, 6200, 310000, ["producthunt.com", "techcrunch.com", "venturebeat.com"], 0, "Namecheap", "", 167],
  ["modelops-com", "modelops.com", ".com", "ai-ml", 69, 1720, 13, "pending_delete", 2600, 3400, 940000, ["forbes.com", "venturebeat.com", "mit.edu"], 1, "GoDaddy", "e", 342],
  ["agentfabric-io", "agentfabric.io", ".io", "ai-ml", 47, 310, 5, "closeout", 2880, 1200, 128000, ["producthunt.com", "dev.to"], 0, "Porkbun", "", 58],
  ["synthmind-ai", "synthmind.ai", ".ai", "ai-ml", 76, 3120, 9, "auction", 210, 12800, 1420000, ["wikipedia.org", "nature.com", "harvard.edu"], 2, "Dynadot", "e", 421],
  // ---- 2. Fintech & Payments ----
  ["payflow-co", "payflow.co", ".co", "fintech", 61, 1180, 8, "pending_delete", 130, 5400, 465000, ["forbes.com", "bloomberg.com", "ft.com"], 1, "GoDaddy", "", 254],
  ["ledgerloop-com", "ledgerloop.com", ".com", "fintech", 55, 760, 12, "pending_delete", 700, 2600, 380000, ["coindesk.com", "techcrunch.com"], 0, "Namecheap", "", 121],
  ["swipestack-co", "swipestack.co", ".co", "fintech", 44, 280, 6, "auction", 2600, 1500, 142000, ["producthunt.com", "medium.com"], 0, "Porkbun", "", 64],
  ["vaultpay-dev", "vaultpay.dev", ".dev", "fintech", 49, 420, 4, "closeout", 1500, 2100, 176000, ["github.com", "stackoverflow.com"], 0, "Namecheap", "", 88],
  ["creditpulse-com", "creditpulse.com", ".com", "fintech", 66, 1490, 15, "pending_delete", 2200, 4300, 720000, ["wsj.com", "nytimes.com", "harvard.edu"], 1, "GoDaddy", "e", 296],
  ["coinharbor-co", "coinharbor.co", ".co", "fintech", 41, 190, 7, "expired", 2870, 1300, 126000, ["coindesk.com", "reddit.com"], 3, "Dynadot", "", 41],
  // ---- 3. Health & Biotechnology ----
  ["healthpulse-io", "healthpulse.io", ".io", "health", 63, 1040, 10, "pending_delete", 75, 7200, 540000, ["nih.gov", "webmd.com", "who.int"], 0, "Dynadot", "e", 268],
  ["genomelab-org", "genomelab.org", ".org", "health", 57, 830, 16, "auction", 1300, 3900, 410000, ["nature.com", "stanford.edu", "sciencedaily.com"], 0, "Namecheap", "e", 173],
  ["biocurve-com", "biocurve.com", ".com", "health", 52, 610, 9, "pending_delete", 2700, 2400, 265000, ["biopharmatrend.com", "medium.com"], 0, "GoDaddy", "", 97],
  ["sleepmetrics-io", "sleepmetrics.io", ".io", "health", 46, 350, 5, "closeout", 2100, 1800, 158000, ["sleepfoundation.org", "healthline.com"], 0, "Porkbun", "", 72],
  ["vitalsync-org", "vitalsync.org", ".org", "health", 60, 940, 11, "pending_delete", 400, 3100, 355000, ["mayoclinic.org", "cdc.gov", "webmd.com"], 1, "Dynadot", "e", 189],
  ["dermascan-com", "dermascan.com", ".com", "health", 71, 1980, 14, "auction", 340, 9800, 985000, ["thelancet.com", "wikipedia.org", "nature.com"], 2, "GoDaddy", "t", 356],
  // ---- 4. Developer Tools & Cloud Infrastructure ----
  ["deployhawk-dev", "deployhawk.dev", ".dev", "devtools", 54, 690, 6, "pending_delete", 110, 2900, 298000, ["github.com", "dev.to", "hashnode.dev"], 0, "Namecheap", "", 143],
  ["stackprobe-io", "stackprobe.io", ".io", "devtools", 62, 1120, 8, "auction", 1600, 5100, 470000, ["news.ycombinator.com", "techcrunch.com", "github.com"], 0, "Dynadot", "", 231],
  ["gitpulse-dev", "gitpulse.dev", ".dev", "devtools", 43, 240, 4, "pending_delete", 2750, 1300, 121000, ["github.com", "reddit.com"], 0, "Porkbun", "", 49],
  ["containerly-io", "containerly.io", ".io", "devtools", 51, 520, 7, "closeout", 1900, 2200, 205000, ["docker.com", "kubernetes.io", "cncf.io"], 0, "Namecheap", "", 112],
  ["pipeliner-dev", "pipeliner.dev", ".dev", "devtools", 48, 390, 9, "pending_delete", 600, 1900, 168000, ["gitlab.com", "medium.com"], 2, "GoDaddy", "", 66],
  ["cloudlattice-com", "cloudlattice.com", ".com", "devtools", 74, 2660, 12, "auction", 150, 11200, 1260000, ["forbes.com", "wired.com", "techcrunch.com"], 1, "Dynadot", "t", 397],
  // ---- 5. E-Commerce & Consumer Brands ----
  ["cartloom-com", "cartloom.com", ".com", "ecommerce", 59, 870, 10, "pending_delete", 55, 4600, 415000, ["shopify.com", "forbes.com", "practicalcommerce.com"], 0, "GoDaddy", "", 205],
  ["shelfcraft-co", "shelfcraft.co", ".co", "ecommerce", 45, 300, 6, "auction", 2300, 1600, 149000, ["etsy.com", "pinterest.com"], 0, "Porkbun", "", 57],
  ["boutiquebay-com", "boutiquebay.com", ".com", "ecommerce", 53, 640, 13, "pending_delete", 1700, 2700, 325000, ["vogue.com", "etsy.com", "businessoffashion.com"], 0, "Namecheap", "", 126],
  ["urbanbasket-co", "urbanbasket.co", ".co", "ecommerce", 40, 160, 5, "closeout", 2500, 1200, 124000, ["producthunt.com", "instagram.com"], 0, "Porkbun", "", 33],
  ["giftorbit-com", "giftorbit.com", ".com", "ecommerce", 65, 1310, 11, "pending_delete", 980, 3600, 585000, ["mashable.com", "buzzfeed.com", "gizmodo.com"], 4, "GoDaddy", "s", 178],
  ["purepantry-com", "purepantry.com", ".com", "ecommerce", 68, 1840, 17, "auction", 45, 8400, 890000, ["wikipedia.org", "nytimes.com", "cornell.edu", "forbes.com"], 0, "Dynadot", "e", 312],
];

/** Deterministic PRNG so synthetic curves are stable per domain. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildTrend(id: string, estValuationUsd: number, watchers: number): HistoricalTrend {
  const rng = mulberry32(hashString(id));
  const interest: number[] = [];
  const valuation: number[] = [];
  let i = 22 + rng() * 18;
  let v = estValuationUsd * (0.52 + rng() * 0.2);
  for (let k = 0; k < 30; k++) {
    i = Math.min(100, Math.max(4, i + (rng() - 0.42) * 9 + k * 0.55));
    v = Math.max(estValuationUsd * 0.35, v * (1 + (rng() - 0.44) * 0.06));
    interest.push(Math.round(i * 10) / 10);
    valuation.push(Math.round(v));
  }
  interest[29] = Math.min(100, Math.round(i + 8));
  valuation[29] = estValuationUsd;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const monthlySearches = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + idx, 1));
    const base = 800 + Math.round(rng() * 2400);
    return { month: `${monthNames[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`, volume: base + idx * Math.round(rng() * 380) };
  });

  return { interest, valuation, watchers, monthlySearches };
}

function materialize(seed: Seed, now: number): SniperDomain {
  const [
    id, domainName, tld, category, domainRating, referringDomains, archiveAgeYears,
    dropStage, etaMinutes, currentBidUsd, estValuationUsd, topBacklinks,
    spamScorePercent, registrar, flagString, watchers,
  ] = seed;
  const flags = {
    eduGov: flagString.includes("e") || topBacklinks.some((b) => b.endsWith(".edu") || b.endsWith(".gov")),
    spamAnchors: flagString.includes("s"),
    trademark: flagString.includes("t"),
  };
  return {
    id,
    domainName,
    tld,
    category,
    domainRating,
    referringDomains,
    archiveAgeYears,
    dropStage,
    dropEta: new Date(now + etaMinutes * 60_000).toISOString(),
    currentBidUsd,
    estValuationUsd,
    topBacklinks: [...topBacklinks],
    spamScorePercent,
    registrar,
    historicalTrend: buildTrend(id, estValuationUsd, watchers),
    flags,
  };
}

type CatalogGlobal = typeof globalThis & {
  __dsMemCatalog?: { builtAt: number; items: SniperDomain[] };
};

/**
 * Returns the 30-domain catalog with drop ETAs anchored to first access, so
 * countdowns stay consistent across every request in the process lifetime.
 */
export function getFallbackDomains(): SniperDomain[] {
  const g = globalThis as CatalogGlobal;
  if (g.__dsMemCatalog) return g.__dsMemCatalog.items;
  const builtAt = Date.now();
  const items = SEEDS.map((s) => materialize(s, builtAt));
  g.__dsMemCatalog = { builtAt, items };
  return items;
}

export const OFFLINE_CATALOG_SIZE = SEEDS.length;

/** Deterministic 60-point history series for the audit charts. */
export function synthesizeHistory(id: string, estValuationUsd: number): {
  valuation: number[];
  interest: number[];
  labels: string[];
} {
  const rng = mulberry32(hashString(`history:${id}`));
  const valuation: number[] = [];
  const interest: number[] = [];
  const labels: string[] = [];
  let v = estValuationUsd * (0.48 + rng() * 0.18);
  let i = 18 + rng() * 20;
  const now = Date.now();
  for (let k = 59; k >= 0; k--) {
    const t = new Date(now - k * 86_400_000);
    labels.push(`${t.getUTCMonth() + 1}/${t.getUTCDate()}`);
    v = Math.max(estValuationUsd * 0.3, v * (1 + (rng() - 0.45) * 0.045));
    i = Math.min(100, Math.max(3, i + (rng() - 0.44) * 7));
    valuation.push(Math.round(v));
    interest.push(Math.round(i));
  }
  valuation[59] = estValuationUsd;
  interest[59] = Math.min(100, Math.round(i + 6));
  return { valuation, interest, labels };
}
