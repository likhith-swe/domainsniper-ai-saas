import type { DomainCategory, EnrichedDomain } from "./types";
import { usdMinorToNumber } from "./format";

export const CATEGORY_LABELS: Record<DomainCategory, string> = {
  "ai-ml": "AI & Machine Learning",
  fintech: "Fintech & Payments",
  health: "Health & Biotechnology",
  devtools: "Developer Tools & Cloud",
  ecommerce: "E-Commerce & Consumer",
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_LABELS) as DomainCategory[];

export const SITE_NAME = "DomainSniper AI";

export function hubTitle(tld: string, category: DomainCategory): string {
  const t = tld.startsWith(".") ? tld : `.${tld}`;
  return `Expiring ${t} ${CATEGORY_LABELS[category]} Domains`;
}

export function hubDescription(tld: string, category: DomainCategory): string {
  const t = tld.startsWith(".") ? tld : `.${tld}`;
  return `Live drop radar for ${CATEGORY_LABELS[category]} domains on ${t} — SniperScore valuation, backlink juice audit and tripwire alerts before each ICANN pending-delete drop.`;
}

/** Product + Offer JSON-LD for a dropping domain. */
export function productJsonLd(d: EnrichedDomain, appUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: d.domainName,
    description: `Expiring ${d.tld} domain — DR ${d.domainRating}, ${d.referringDomains} referring domains, SniperScore ${d.score.total}/100. Estimated secondary-market value $${usdMinorToNumber(d.estValuationUsd)}.`,
    sku: d.id,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: `${appUrl}/domain/${d.id}`,
      priceCurrency: "USD",
      price: usdMinorToNumber(d.estValuationUsd),
      availability: "https://schema.org/LimitedAvailability",
      validThrough: d.dropEta,
    },
  };
}

/** BreadcrumbList JSON-LD. */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQ JSON-LD for hub pages. */
export function faqJsonLd(qa: { q: string; a: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
