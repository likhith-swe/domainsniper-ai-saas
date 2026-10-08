import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Countdown from "@/components/Countdown";
import DomainAuditActions from "@/components/DomainAuditActions";
import ValuationChart from "@/components/ValuationChart";
import { getFallbackDomains } from "@/lib/fallback-domains";
import { usdMinorToDollars } from "@/lib/format";
import { getDomain, getDomainHistory } from "@/lib/queries";
import { breadcrumbJsonLd, productJsonLd, CATEGORY_LABELS } from "@/lib/seo";
import { ENV } from "@/lib/env";
import type { ScoreBreakdown } from "@/lib/types";

export function generateStaticParams(): { id: string }[] {
  return getFallbackDomains().map((d) => ({ id: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await getDomain(id);
  if (!d) return { title: "Domain not found" };
  return {
    title: `${d.domainName} — SniperScore ${d.score.total}/100`,
    description: `Expiring ${d.tld} domain ${d.domainName}: DR ${d.domainRating}, ${d.referringDomains} referring domains, est. value ${usdMinorToDollars(d.estValuationUsd)}. Full backlink juice audit & drop countdown.`,
    openGraph: {
      title: `${d.domainName} — SniperScore ${d.score.total}/100`,
      description: `DR ${d.domainRating} · ${d.referringDomains} RDs · est. ${usdMinorToDollars(d.estValuationUsd)}`,
      images: [
        `/api/og?domain=${encodeURIComponent(d.domainName)}&score=${d.score.total}&val=${d.estValuationUsd}&grade=${d.score.grade}`,
      ],
    },
  };
}

const STAGE_LABEL: Record<string, { label: string; cls: string }> = {
  pending_delete: { label: "PENDING DELETE", cls: "border-amberx/50 bg-amberx/10 text-amberx" },
  auction: { label: "LIVE AUCTION", cls: "border-radar/50 bg-radar/10 text-radar" },
  closeout: { label: "CLOSEOUT", cls: "border-line bg-panel2 text-fog" },
  expired: { label: "EXPIRED", cls: "border-dangerx/50 bg-dangerx/10 text-dangerx" },
};

function ScoreBar({
  label,
  value,
  weight,
  tone,
}: {
  label: string;
  value: number;
  weight: string;
  tone: "pos" | "neg" | "bonus";
}) {
  const width = Math.min(100, Math.abs(value));
  const barColor =
    tone === "neg" ? "bg-dangerx" : tone === "bonus" ? "bg-amberx" : "bg-radar";
  const valueLabel = tone === "neg" ? `−${Math.abs(value)}` : tone === "bonus" ? `+${value}` : value.toFixed(1);
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-fog">
          {label} <span className="text-fog2">({weight})</span>
        </span>
        <span className={tone === "neg" ? "text-dangerx" : tone === "bonus" ? "text-amberx" : "text-radar"}>
          {valueLabel}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full bg-line">
        <div className={`h-full ${barColor}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [d, hist] = await Promise.all([getDomain(id), getDomainHistory(id)]);
  if (!d || !hist.history) notFound();

  const stage = STAGE_LABEL[d.dropStage] ?? STAGE_LABEL.closeout;
  const score: ScoreBreakdown = d.score;
  const backUrl = `/drops/${d.tld.replace(".", "")}/${d.category}`;

  const jsonLd = [
    productJsonLd(d, ENV.appUrl),
    breadcrumbJsonLd([
      { name: "Radar", url: ENV.appUrl },
      { name: CATEGORY_LABELS[d.category], url: `${ENV.appUrl}${backUrl}` },
      { name: d.domainName, url: `${ENV.appUrl}/domain/${d.id}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a href={backUrl} className="font-mono text-xs text-fog transition hover:text-radar">
        ← {CATEGORY_LABELS[d.category]} radar
      </a>

      {/* header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-6 border border-line bg-panel p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-3xl font-bold text-paper sm:text-4xl">
              {d.domainName}
            </h1>
            <span className={`border px-2 py-1 font-mono text-[10px] tracking-wider ${stage.cls}`}>
              {stage.label}
            </span>
            {score.isHighValueSniper ? (
              <span className="border border-amberx/60 bg-abyss px-2 py-1 font-mono text-[10px] tracking-[0.2em] text-amberx">
                ⌖ SNIPER TARGET
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-fog">
            <span>REGISTRAR: <span className="text-paper">{d.registrar}</span></span>
            <span>AGE: <span className="text-paper">{d.archiveAgeYears}y archived</span></span>
            <span>WATCHERS: <span className="text-paper">{d.historicalTrend.watchers}</span></span>
            <span>SPAM: <span className={d.spamScorePercent > 2 ? "text-dangerx" : "text-paper"}>{d.spamScorePercent}%</span></span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.25em] text-fog2">DROPS IN</span>
            <Countdown targetIso={d.dropEta} className="text-2xl font-bold" />
          </div>
        </div>
        <div className="shrink-0 text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-fog2">SNIPERSCORE</p>
          <p className={`font-mono text-6xl font-bold ${score.isHighValueSniper ? "text-amberx glow-amber" : "text-radar glow-green"}`}>
            {score.total.toFixed(1)}
          </p>
          <p className="mt-1 font-mono text-xs text-fog">GRADE {score.grade} / 100</p>
        </div>
      </div>

      <div className="mt-5">
        <DomainAuditActions d={d} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* score math */}
        <section className="h-fit border border-line bg-panel p-5">
          <h2 className="font-mono text-xs tracking-[0.3em] text-radar">▛ THE MATH</h2>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-fog2">
            0.35·AUTH + 0.25·LINKS + 0.15·AGE + 0.15·BRAND + 0.10·ARB
            + EDU/GOV − SPAM − ™
          </p>
          <div className="mt-4 space-y-3.5">
            <ScoreBar label="AUTHORITY (DR/80)" value={score.authority} weight="×0.35" tone="pos" />
            <ScoreBar label="BACKLINK JUICE (log RD)" value={score.backlinks} weight="×0.25" tone="pos" />
            <ScoreBar label="ARCHIVE AGE" value={score.age} weight="×0.15" tone="pos" />
            <ScoreBar label="BRANDABILITY" value={score.brand} weight="×0.15" tone="pos" />
            <ScoreBar label="ARBITRAGE GAP" value={score.arbitrage} weight="×0.10" tone="pos" />
            {score.eduGovBonus > 0 ? (
              <ScoreBar label=".EDU/.GOV EDITORIAL BONUS" value={score.eduGovBonus} weight="bonus" tone="bonus" />
            ) : null}
            {score.spamPenalty > 0 ? (
              <ScoreBar label="SPAM ANCHOR PENALTY" value={score.spamPenalty} weight="penalty" tone="neg" />
            ) : null}
            {score.trademarkPenalty > 0 ? (
              <ScoreBar label="TRADEMARK COLLISION PENALTY" value={score.trademarkPenalty} weight="penalty" tone="neg" />
            ) : null}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex justify-between font-mono text-sm">
              <span className="text-fog">FINAL SNIPERSCORE</span>
              <span className={score.isHighValueSniper ? "text-amberx" : "text-radar"}>
                {score.total.toFixed(1)} / 100
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-fog2">
              {score.isHighValueSniper
                ? "Qualifies as a high-value sniper target (score ≥ 82 and est. value ≥ $1,200)."
                : "Below the high-value sniper threshold (score ≥ 82 + est. value ≥ $1,200)."}
            </p>
          </div>
        </section>

        <div className="space-y-6">
          {/* valuation chart */}
          <section className="border border-line bg-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs tracking-[0.3em] text-amberx">
                ▛ 60-DAY VALUATION TAPE
              </h2>
              <div className="font-mono text-[11px] text-fog">
                EST. <span className="text-amberx">{usdMinorToDollars(d.estValuationUsd)}</span>
                <span className="mx-2 text-fog2">·</span>
                BID <span className="text-paper">{usdMinorToDollars(d.currentBidUsd)}</span>
                <span className="mx-2 text-fog2">·</span>
                ARB <span className="text-radar">+{score.arbitrage.toFixed(0)}%</span>
              </div>
            </div>
            <div className="mt-4">
              <ValuationChart
                valuation={hist.history.valuation}
                interest={hist.history.interest}
                labels={hist.history.labels}
              />
            </div>
          </section>

          {/* backlink breakdown */}
          <section className="border border-line bg-panel p-5">
            <h2 className="font-mono text-xs tracking-[0.3em] text-radar">
              ▛ AUTHORITY BACKLINK BREAKDOWN
            </h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {d.topBacklinks.map((b) => {
                const eduGov = b.endsWith(".edu") || b.endsWith(".gov");
                return (
                  <div
                    key={b}
                    className="flex items-center justify-between border border-line bg-panel2 px-3 py-2.5"
                  >
                    <span className="truncate font-mono text-xs text-paper">{b}</span>
                    {eduGov ? (
                      <span className="ml-2 shrink-0 border border-radar/50 px-1.5 py-0.5 font-mono text-[9px] text-radar">
                        +15 BONUS
                      </span>
                    ) : (
                      <span className="ml-2 shrink-0 font-mono text-[9px] text-fog2">EDITORIAL</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] text-fog">
              <span>TOTAL REFERRING DOMAINS: <span className="text-paper">{d.referringDomains.toLocaleString("en-US")}</span></span>
              <span>MONTHLY SEARCH TREND:{" "}
                {d.historicalTrend.monthlySearches.slice(-3).map((m) => `${m.month} ${m.volume}`).join(" · ")}
              </span>
            </div>
          </section>

          {/* risk panel */}
          <section className="border border-line bg-panel p-5">
            <h2 className="font-mono text-xs tracking-[0.3em] text-dangerx">▛ RISK AUDIT</h2>
            <ul className="mt-3 space-y-2 font-mono text-xs">
              <li className={d.flags.spamAnchors ? "text-dangerx" : "text-fog"}>
                {d.flags.spamAnchors
                  ? "✗ Historical anchor text contains casino / PBN footprints (−35 applied)"
                  : "✓ Clean anchor history — no casino/adult/PBN footprints"}
              </li>
              <li className={d.flags.trademark ? "text-dangerx" : "text-fog"}>
                {d.flags.trademark
                  ? "✗ Collides with an active registered trademark (−50 applied) — legal review advised"
                  : "✓ No active trademark collisions detected"}
              </li>
              <li className="text-fog">
                Spam score {d.spamScorePercent}% (threshold 15%) ·{" "}
                {d.flags.eduGov
                  ? ".edu/.gov editorial placements verified (+15 applied)"
                  : "no .edu/.gov editorial placements"}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
