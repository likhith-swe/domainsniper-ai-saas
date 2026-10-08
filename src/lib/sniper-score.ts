import type {
  DomainFilters,
  EnrichedDomain,
  ScoreBreakdown,
  SniperDomain,
  SortKey,
} from "./types";

const clamp = (v: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, v));

/**
 * Proprietary SniperScore (0–100):
 * 0.35*S_authority + 0.25*S_backlinks + 0.15*S_age + 0.15*S_brand
 *   + 0.10*S_arbitrage + B_edu_gov − P_spam − P_trademark
 */
export function computeSniperScore(d: SniperDomain): ScoreBreakdown {
  const authority = clamp((d.domainRating / 80) * 100);
  const backlinks = clamp(
    (Math.log10(d.referringDomains + 1) / Math.log10(1000)) * 100,
  );
  const age = clamp((d.archiveAgeYears / 15) * 100);

  const label = d.domainName.split(".")[0].toLowerCase();
  const hyphenatedOrNumeric = /[-0-9]/.test(label);
  let brand: number;
  if (hyphenatedOrNumeric) {
    brand = 50;
  } else if ((d.tld === ".com" || d.tld === ".ai") && label.length <= 6) {
    brand = 100;
  } else if (d.tld === ".io" || d.tld === ".co") {
    brand = 80;
  } else {
    brand = 62;
  }

  const arbitrage =
    d.estValuationUsd > 0
      ? clamp(((d.estValuationUsd - d.currentBidUsd) / d.estValuationUsd) * 100)
      : 0;

  const eduGovBonus = d.flags.eduGov ? 15 : 0;
  const spamPenalty = d.flags.spamAnchors ? 35 : 0;
  const trademarkPenalty = d.flags.trademark ? 50 : 0;

  const raw =
    0.35 * authority +
    0.25 * backlinks +
    0.15 * age +
    0.15 * brand +
    0.1 * arbitrage +
    eduGovBonus -
    spamPenalty -
    trademarkPenalty;

  const total = Math.round(clamp(raw) * 10) / 10;
  const grade = total >= 90 ? "S" : total >= 82 ? "A" : total >= 65 ? "B" : "C";
  const isHighValueSniper = total >= 82 && d.estValuationUsd >= 120_000;

  return {
    authority: Math.round(authority * 10) / 10,
    backlinks: Math.round(backlinks * 10) / 10,
    age: Math.round(age * 10) / 10,
    brand,
    arbitrage: Math.round(arbitrage * 10) / 10,
    eduGovBonus,
    spamPenalty,
    trademarkPenalty,
    total,
    grade,
    isHighValueSniper,
  };
}

export function enrich(d: SniperDomain): EnrichedDomain {
  return { ...d, score: computeSniperScore(d) };
}

export function enrichAll(items: SniperDomain[]): EnrichedDomain[] {
  return items.map(enrich);
}

export function sortDomains(items: EnrichedDomain[], sort: SortKey): EnrichedDomain[] {
  const arr = [...items];
  switch (sort) {
    case "ending":
      arr.sort(
        (a, b) => new Date(a.dropEta).getTime() - new Date(b.dropEta).getTime(),
      );
      break;
    case "price_asc":
      arr.sort((a, b) => a.currentBidUsd - b.currentBidUsd);
      break;
    case "price_desc":
      arr.sort((a, b) => b.currentBidUsd - a.currentBidUsd);
      break;
    case "dr":
      arr.sort((a, b) => b.domainRating - a.domainRating);
      break;
    case "valuation":
      arr.sort((a, b) => b.estValuationUsd - a.estValuationUsd);
      break;
    case "score":
    default:
      arr.sort((a, b) => b.score.total - a.score.total);
      break;
  }
  return arr;
}

export function filterDomains(
  items: EnrichedDomain[],
  f: DomainFilters,
): EnrichedDomain[] {
  let out = items;
  if (f.tlds && f.tlds.length > 0) {
    const set = new Set(f.tlds.map((t) => (t.startsWith(".") ? t : `.${t}`)));
    out = out.filter((d) => set.has(d.tld));
  }
  if (typeof f.minDr === "number" && f.minDr > 0) {
    out = out.filter((d) => d.domainRating >= f.minDr!);
  }
  if (typeof f.maxPriceUsd === "number" && f.maxPriceUsd > 0) {
    const maxMinor = f.maxPriceUsd * 100;
    out = out.filter((d) => d.currentBidUsd <= maxMinor);
  }
  if (f.q && f.q.trim().length > 0) {
    const q = f.q.trim().toLowerCase();
    out = out.filter(
      (d) =>
        d.domainName.toLowerCase().includes(q) ||
        d.topBacklinks.some((b) => b.toLowerCase().includes(q)) ||
        d.registrar.toLowerCase().includes(q),
    );
  }
  if (f.category && f.category !== "all") {
    out = out.filter((d) => d.category === f.category);
  }
  if (f.stage && f.stage !== "all") {
    out = out.filter((d) => d.dropStage === f.stage);
  }
  return out;
}
