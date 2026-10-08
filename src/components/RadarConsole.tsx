"use client";

import { useState } from "react";
import type { EnrichedDomain } from "@/lib/types";
import DomainGrid, { type GridFilters } from "./DomainGrid";
import DropTicker from "./DropTicker";
import Hero from "./Hero";

export default function RadarConsole({
  initialItems,
  initialSource,
  stats,
  tickerItems = [],
}: {
  initialItems: EnrichedDomain[];
  initialSource: string;
  stats: { total: number; snipers: number; imminent: number };
  tickerItems?: EnrichedDomain[];
}) {
  const [filters, setFilters] = useState<GridFilters>({
    q: "",
    tlds: [],
    minDr: 0,
    maxPriceUsd: 0,
    category: "all",
  });
  const [tick, setTick] = useState(0);

  const scan = () => {
    setTick((t) => t + 1);
    if (typeof document !== "undefined") {
      document.getElementById("radar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <Hero value={filters} onChange={setFilters} onScan={scan} stats={stats} />
      <DropTicker items={tickerItems} />
      <section id="radar" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-mono text-sm tracking-[0.3em] text-radar">
            ▛ LIVE DROP GRID
          </h2>
          <span className="font-mono text-[10px] text-fog2">
            refreshes against the domains API · filters debounced
          </span>
        </div>
        <DomainGrid
          initialItems={initialItems}
          initialSource={initialSource}
          filters={filters}
          refreshKey={tick}
        />
      </section>
    </>
  );
}
