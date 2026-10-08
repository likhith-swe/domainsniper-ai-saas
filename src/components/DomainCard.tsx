"use client";

import type { EnrichedDomain } from "@/lib/types";
import { compactNumber, usdMinorToDollars } from "@/lib/format";
import Countdown from "./Countdown";
import { useModals } from "./GlobalModals";

const STAGE_CHIP: Record<string, string> = {
  pending_delete: "border-amberx/40 bg-amberx/10 text-amberx",
  auction: "border-radar/40 bg-radar/10 text-radar",
  closeout: "border-line bg-panel2 text-fog",
  expired: "border-dangerx/40 bg-dangerx/10 text-dangerx",
};

const GRADE_STYLE: Record<string, string> = {
  S: "border-amberx/60 text-amberx glow-amber",
  A: "border-radar/60 text-radar glow-green",
  B: "border-fog/40 text-fog",
  C: "border-fog2/40 text-fog2",
};

export default function DomainCard({ d }: { d: EnrichedDomain }) {
  const { open } = useModals();
  const sniper = d.score.isHighValueSniper;
  const bid = usdMinorToDollars(d.currentBidUsd);
  const value = usdMinorToDollars(d.estValuationUsd);

  return (
    <article
      className={`card-glow group relative flex flex-col gap-3 border bg-panel p-4 ${
        sniper ? "card-glow-amber border-amberx/30" : "border-line"
      }`}
    >
      {sniper ? (
        <span className="absolute -top-2.5 right-3 border border-amberx/60 bg-abyss px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-amberx">
          ⌖ SNIPER TARGET
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={`/domain/${d.id}`}
            className="block truncate font-mono text-lg font-bold text-paper transition group-hover:text-radar"
            title={d.domainName}
          >
            {d.domainName}
          </a>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STAGE_CHIP[d.dropStage]}`}>
              {d.dropStage.replace("_", " ")}
            </span>
            <span className="font-mono text-[10px] text-fog2">{d.registrar}</span>
            {d.flags.eduGov ? (
              <span className="border border-radar/40 px-1.5 py-0.5 font-mono text-[10px] text-radar">.EDU/.GOV</span>
            ) : null}
            {d.flags.trademark ? (
              <span className="border border-dangerx/40 px-1.5 py-0.5 font-mono text-[10px] text-dangerx">™ RISK</span>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`font-mono text-2xl font-bold leading-none ${sniper ? "text-amberx glow-amber" : "text-radar glow-green"}`}>
            {d.score.total.toFixed(1)}
          </div>
          <div className={`mt-1 inline-block border px-1.5 font-mono text-[10px] ${GRADE_STYLE[d.score.grade]}`}>
            GRADE {d.score.grade}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-y border-line py-2 font-mono text-[11px]">
        <div>
          <p className="text-fog2">DR</p>
          <p className="text-paper">{d.domainRating}</p>
        </div>
        <div>
          <p className="text-fog2">REF. DOMAINS</p>
          <p className="text-paper">{compactNumber(d.referringDomains)}</p>
        </div>
        <div>
          <p className="text-fog2">ARCHIVE AGE</p>
          <p className="text-paper">{d.archiveAgeYears}y</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs">
          <p>
            <span className="text-fog2">BID </span>
            <span className="text-paper">{bid}</span>
          </p>
          <p>
            <span className="text-fog2">EST. </span>
            <span className="text-amberx">{value}</span>
            <span className="ml-1.5 text-radar">+{d.score.arbitrage.toFixed(0)}% arb</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-fog2">DROPS IN</p>
          <Countdown targetIso={d.dropEta} compact className="text-sm font-bold" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {d.topBacklinks.slice(0, 3).map((b) => (
          <span key={b} className="border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-fog">
            {b}
          </span>
        ))}
        <button
          type="button"
          onClick={() => open("backlinks", { domain: d })}
          className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-radar transition hover:border-radar/50"
        >
          +{Math.max(0, d.topBacklinks.length - 3)} more →
        </button>
      </div>

      <div className="mt-auto flex gap-2 pt-1">
        <a
          href={`/api/go/domain/${d.id}`}
          target="_blank"
          rel="sponsored noopener"
          className="flex-1 border border-radar/50 bg-radar-soft px-3 py-2 text-center font-mono text-xs font-bold text-radar transition hover:bg-radar/20"
        >
          CLAIM DROP ↗
        </a>
        <a
          href={`/domain/${d.id}`}
          className="border border-line px-3 py-2 font-mono text-xs text-fog transition hover:border-fog/50 hover:text-paper"
        >
          AUDIT
        </a>
        <button
          type="button"
          title="Set tripwire alert"
          onClick={() => open("watchlist", { domain: d, tld: d.tld })}
          className="border border-line px-3 py-2 font-mono text-xs text-amberx transition hover:border-amberx/50 hover:bg-amberx/10"
        >
          ⌖
        </button>
      </div>
    </article>
  );
}
