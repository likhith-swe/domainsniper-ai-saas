"use client";

import type { EnrichedDomain } from "@/lib/types";
import { hashString } from "@/lib/fallback-domains";
import { ModalShell } from "./GlobalModals";

function classify(source: string): { tag: string; cls: string } {
  if (source.endsWith(".edu")) return { tag: ".EDU", cls: "border-radar/50 text-radar" };
  if (source.endsWith(".gov") || source.endsWith(".gov.in")) {
    return { tag: ".GOV", cls: "border-radar/50 text-radar" };
  }
  const news = ["wikipedia.org", "forbes.com", "techcrunch.com", "nytimes.com", "wsj.com", "bloomberg.com", "wired.com", "nature.com", "thelancet.com", "vogue.com", "mashable.com", "buzzfeed.com", "ft.com", "coindesk.com", "venturebeat.com", "gizmodo.com"];
  if (news.includes(source)) return { tag: "NEWS", cls: "border-amberx/50 text-amberx" };
  return { tag: "REF", cls: "border-line text-fog" };
}

export default function BacklinkModal({
  onClose,
  domain,
}: {
  onClose: () => void;
  domain: EnrichedDomain | null;
}) {
  if (!domain) return null;

  const rows = domain.topBacklinks.map((source) => {
    const h = hashString(`${domain.id}:${source}`);
    return {
      source,
      dr: 42 + (h % 53),
      traffic: 50 + (h % 900),
      anchor: (h & 1) === 0 ? domain.domainName.split(".")[0] : "read more",
      ...classify(source),
    };
  });

  return (
    <ModalShell
      wide
      title={`Backlink vault — ${domain.domainName}`}
      subtitle={`${domain.referringDomains.toLocaleString("en-US")} referring domains indexed · top authority inbound links`}
      onClose={onClose}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-line text-left text-[10px] tracking-[0.2em] text-fog2">
              <th className="py-2 pr-3">SOURCE</th>
              <th className="py-2 pr-3">TYPE</th>
              <th className="py-2 pr-3">EST. DR</th>
              <th className="py-2 pr-3">TRAFFIC (k/mo)</th>
              <th className="py-2">ANCHOR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.source} className="border-b border-line/60">
                <td className="py-2.5 pr-3 text-paper">{r.source}</td>
                <td className="py-2.5 pr-3">
                  <span className={`border px-1.5 py-0.5 text-[10px] ${r.cls}`}>{r.tag}</span>
                </td>
                <td className="py-2.5 pr-3 text-amberx">{r.dr}</td>
                <td className="py-2.5 pr-3 text-fog">{r.traffic}k</td>
                <td className="py-2.5 text-fog2">“{r.anchor}”</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[11px] text-fog2">
          {domain.flags.eduGov
            ? "✓ Verified editorial .edu/.gov placements — +15 SniperScore bonus applied."
            : domain.flags.spamAnchors
              ? "⚠ Historical casino/PBN anchor footprints detected — −35 penalty applied."
              : "Clean anchor profile — no spam footprints detected."}
        </p>
        <a
          href={`/domain/${domain.id}`}
          className="shrink-0 border border-radar/50 bg-radar-soft px-3 py-2 font-mono text-xs font-bold text-radar transition hover:bg-radar/20"
        >
          FULL AUDIT →
        </a>
      </div>
    </ModalShell>
  );
}
