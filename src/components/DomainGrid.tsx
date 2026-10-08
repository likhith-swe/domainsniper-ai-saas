"use client";

import { useEffect, useRef, useState } from "react";
import type { DomainListResult, EnrichedDomain, SortKey } from "@/lib/types";
import DomainCard from "./DomainCard";

export interface GridFilters {
  q: string;
  tlds: string[];
  minDr: number;
  maxPriceUsd: number;
  category: string;
}

const SORT_LABELS: { value: SortKey; label: string }[] = [
  { value: "score", label: "SniperScore" },
  { value: "ending", label: "Ending soonest" },
  { value: "valuation", label: "Est. valuation" },
  { value: "dr", label: "Domain rating" },
  { value: "price_asc", label: "Bid: low → high" },
  { value: "price_desc", label: "Bid: high → low" },
];

export default function DomainGrid({
  initialItems,
  initialSource = "memory",
  filters,
  refreshKey = 0,
}: {
  initialItems: EnrichedDomain[];
  initialSource?: string;
  filters?: GridFilters;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<EnrichedDomain[]>(initialItems);
  const [total, setTotal] = useState(initialItems.length);
  const [source, setSource] = useState(initialSource);
  const [sort, setSort] = useState<SortKey>("score");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!filters) return;
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.q.trim()) params.set("q", filters.q.trim());
        if (filters.tlds.length > 0) params.set("tld", filters.tlds.join(","));
        if (filters.minDr > 0) params.set("minDr", String(filters.minDr));
        if (filters.maxPriceUsd > 0) params.set("maxPrice", String(filters.maxPriceUsd));
        if (filters.category && filters.category !== "all") {
          params.set("category", filters.category);
        }
        params.set("sort", sort);
        params.set("limit", "30");
        const res = await fetch(`/api/domains?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("fetch-failed");
        const data = (await res.json()) as DomainListResult;
        setItems(data.items);
        setTotal(data.total);
        setSource(data.source);
      } catch {
        // aborted or offline — keep previous items
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [filters, sort, refreshKey]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-fog">
          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${loading ? "bg-amberx" : "bg-radar"}`} />
          {loading ? "SCANNING…" : `${total} DROPS TRACKED`} · SOURCE:{" "}
          <span className={source === "postgres" ? "text-radar" : "text-amberx"}>
            {source === "postgres" ? "POSTGRES" : "OFFLINE CATALOG"}
          </span>
        </p>
        <label className="flex items-center gap-2 font-mono text-xs text-fog">
          SORT
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-line bg-panel px-2 py-1.5 font-mono text-xs text-paper outline-none focus:border-radar/60"
          >
            {SORT_LABELS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-line bg-panel p-10 text-center">
          <p className="font-mono text-sm text-fog">⦿ NO DROPS MATCH CURRENT FILTERS</p>
          <p className="mt-2 text-xs text-fog2">
            Widen the DR floor or clear the TLD lock to re-acquire targets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((d) => (
            <DomainCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
