"use client";

import { useState } from "react";
import type { EnrichedDomain } from "@/lib/types";
import { useModals } from "./GlobalModals";

export default function DomainAuditActions({ d }: { d: EnrichedDomain }) {
  const { open } = useModals();
  const [copied, setCopied] = useState(false);

  const copyCert = async () => {
    const url = `${window.location.origin}/api/og?domain=${encodeURIComponent(
      d.domainName,
    )}&score=${d.score.total}&val=${d.estValuationUsd}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/go/domain/${d.id}`}
        target="_blank"
        rel="sponsored noopener"
        className="border border-radar bg-radar px-5 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-radar/80"
      >
        CLAIM THIS DROP ↗
      </a>
      <button
        type="button"
        onClick={() => open("watchlist", { domain: d, tld: d.tld })}
        className="border border-amberx/60 bg-amberx/10 px-4 py-2.5 font-mono text-sm font-bold text-amberx transition hover:bg-amberx/20"
      >
        ⌖ SET TRIPWIRE
      </button>
      <button
        type="button"
        onClick={() => open("backlinks", { domain: d })}
        className="border border-line px-4 py-2.5 font-mono text-sm text-fog transition hover:border-fog/60 hover:text-paper"
      >
        BACKLINK VAULT
      </button>
      <button
        type="button"
        onClick={copyCert}
        className="border border-line px-4 py-2.5 font-mono text-sm text-fog transition hover:border-fog/60 hover:text-paper"
      >
        {copied ? "✓ CERT LINK COPIED" : "COPY CERT LINK"}
      </button>
    </div>
  );
}
