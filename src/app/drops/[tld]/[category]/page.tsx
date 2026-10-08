import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DomainGrid from "@/components/DomainGrid";
import { ModalOpener } from "@/components/GlobalModals";
import { getFallbackDomains } from "@/lib/fallback-domains";
import { msUntil } from "@/lib/format";
import { listDomains } from "@/lib/queries";
import {
  breadcrumbJsonLd,
  CATEGORY_LABELS,
  CATEGORY_SLUGS,
  faqJsonLd,
  hubDescription,
  hubTitle,
} from "@/lib/seo";
import { ENV } from "@/lib/env";
import type { DomainCategory } from "@/lib/types";

interface HubParams {
  tld: string;
  category: string;
}

function catalogPairs(): { tld: string; category: DomainCategory }[] {
  const seen = new Set<string>();
  const pairs: { tld: string; category: DomainCategory }[] = [];
  for (const d of getFallbackDomains()) {
    const tld = d.tld.replace(".", "");
    const key = `${tld}/${d.category}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push({ tld, category: d.category });
    }
  }
  return pairs;
}

export function generateStaticParams(): HubParams[] {
  return catalogPairs().map((p) => ({ tld: p.tld, category: p.category }));
}

function isCategory(v: string): v is DomainCategory {
  return (CATEGORY_SLUGS as string[]).includes(v);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<HubParams>;
}): Promise<Metadata> {
  const { tld, category } = await params;
  if (!isCategory(category)) return {};
  return {
    title: hubTitle(tld, category),
    description: hubDescription(tld, category),
  };
}

export default async function DropHubPage({
  params,
}: {
  params: Promise<HubParams>;
}) {
  const { tld, category } = await params;
  if (!isCategory(category)) notFound();

  const res = await listDomains({
    tlds: [`.${tld}`],
    category,
    sort: "score",
    limit: 50,
  });
  if (res.items.length === 0) notFound();

  const title = hubTitle(tld, category);
  const imminent = res.items.filter((d) => {
    const ms = msUntil(d.dropEta);
    return ms > 0 && ms < 24 * 3_600_000 && d.dropStage !== "expired";
  }).length;
  const snipers = res.items.filter((d) => d.score.isHighValueSniper).length;

  const hubs = catalogPairs();
  const related = hubs
    .filter((h) => h.category === category && h.tld !== tld)
    .slice(0, 4);

  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Radar", url: ENV.appUrl },
      { name: CATEGORY_LABELS[category], url: `${ENV.appUrl}/drops/${tld}/${category}` },
    ]),
    faqJsonLd([
      {
        q: `What happens when a ${`.${tld}`} domain hits pending delete?`,
        a: "After expiry and redemption, ICANN holds the domain in pending_delete for 5 days. At the drop moment it becomes first-come-first-serve or enters backorder auctions — our tripwires alert you the second the countdown enters the final 6 hours.",
      },
      {
        q: "How is SniperScore calculated?",
        a: "0.35×authority + 0.25×backlink juice + 0.15×age + 0.15×brandability + 0.10×arbitrage gap, with a +15 .edu/.gov bonus and −35 spam / −50 trademark penalties, clamped to 0–100.",
      },
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="font-mono text-xs tracking-[0.3em] text-radar">
        // DROP HUB · .{tld.toUpperCase()} × {CATEGORY_LABELS[category].toUpperCase()}
      </p>
      <h1 className="mt-2 max-w-3xl text-3xl font-bold text-paper sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog">
        {hubDescription(tld, category)} Every card below carries a live
        SniperScore, the authority backlink breakdown and a sub-second countdown
        to the ICANN release moment.
      </p>

      <div className="mt-5 flex flex-wrap gap-2 font-mono text-[11px]">
        <span className="border border-line bg-panel px-2.5 py-1 text-fog">
          {res.items.length} LIVE DROPS
        </span>
        <span className="border border-line bg-panel px-2.5 py-1 text-amberx">
          {imminent} DROPPING WITHIN 24H
        </span>
        <span className="border border-line bg-panel px-2.5 py-1 text-radar">
          {snipers} SNIPER-GRADE
        </span>
      </div>

      <div className="mt-8">
        <DomainGrid initialItems={res.items} initialSource={res.source} />
      </div>

      {related.length > 0 ? (
        <div className="mt-12 border-t border-line pt-8">
          <p className="font-mono text-xs tracking-[0.3em] text-fog2">
            ▛ MORE {CATEGORY_LABELS[category].toUpperCase()} RADARS
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((h) => (
              <a
                key={`${h.tld}/${h.category}`}
                href={`/drops/${h.tld}/${h.category}`}
                className="border border-line bg-panel px-3 py-1.5 font-mono text-xs text-fog transition hover:border-radar/50 hover:text-radar"
              >
                .{h.tld} →
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border border-amberx/40 bg-amberx/5 p-5">
        <div>
          <p className="font-mono text-sm font-bold text-amberx">
            Never miss a .{tld} drop in this niche again.
          </p>
          <p className="mt-1 text-xs text-fog">
            Arm a tripwire scoped to .{tld} + {CATEGORY_LABELS[category]} and get
            alerted before the final 6 hours.
          </p>
        </div>
        <ModalOpener
          kind="watchlist"
          payload={{ tld: `.${tld}` }}
          className="border border-amberx bg-amberx px-5 py-2.5 font-mono text-xs font-bold text-abyss transition hover:bg-amberx/80"
        >
          ⌖ ARM .{tld.toUpperCase()} TRIPWIRE
        </ModalOpener>
      </div>
    </div>
  );
}
