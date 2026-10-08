"use client";

import type { CSSProperties } from "react";
import type { GridFilters } from "./DomainGrid";

const TLD_OPTIONS = [".com", ".ai", ".io", ".co", ".dev", ".org"];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All categories" },
  { value: "ai-ml", label: "AI & Machine Learning" },
  { value: "fintech", label: "Fintech & Payments" },
  { value: "health", label: "Health & Biotech" },
  { value: "devtools", label: "Dev Tools & Cloud" },
  { value: "ecommerce", label: "E-Commerce & Consumer" },
];

export default function Hero({
  value,
  onChange,
  onScan,
  stats,
}: {
  value: GridFilters;
  onChange: (next: GridFilters) => void;
  onScan: () => void;
  stats: { total: number; snipers: number; imminent: number };
}) {
  const toggleTld = (tld: string) => {
    const tlds = value.tlds.includes(tld)
      ? value.tlds.filter((t) => t !== tld)
      : [...value.tlds, tld];
    onChange({ ...value, tlds });
  };

  const sliderStyle = {
    "--fill": `${(value.minDr / 80) * 100}%`,
  } as CSSProperties;

  return (
    <section className="term-grid relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-radar/10 blur-3xl" />
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-14 sm:pt-20">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-radar">
          <span className="h-2 w-2 rounded-full bg-radar ping-dot" />
          LIVE · {stats.total} DROPS TRACKED · {stats.snipers} SNIPER TARGETS ·{" "}
          {stats.imminent} DROPPING &lt;2H
        </div>

        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-paper sm:text-6xl">
          100,000 domains die daily.
          <br />
          <span className="text-radar glow-green flicker">We snipe the 0.1% worth catching.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-fog sm:text-lg">
          DomainSniper AI watches the ICANN pending-delete queue around the clock,
          scores every drop 0–100 on authority, backlink juice, age, brandability
          and arbitrage — then fires sub-second Telegram, WhatsApp and email
          tripwires before the auction bots do.
        </p>

        {/* scan console */}
        <div className="clip-terminal mt-8 border border-line bg-panel/90 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label className="font-mono text-[10px] tracking-[0.25em] text-fog2">
                TARGET QUERY
              </label>
              <input
                type="text"
                value={value.q}
                onChange={(e) => onChange({ ...value, q: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onScan();
                }}
                placeholder="search domains, backlink sources, registrars…"
                className="mt-1.5 w-full border border-line bg-abyss px-3 py-2.5 font-mono text-sm text-paper outline-none placeholder:text-fog2 focus:border-radar/60"
              />
            </div>
            <div className="w-full lg:w-48">
              <label className="font-mono text-[10px] tracking-[0.25em] text-fog2">
                CATEGORY
              </label>
              <select
                value={value.category}
                onChange={(e) => onChange({ ...value, category: e.target.value })}
                className="mt-1.5 w-full border border-line bg-abyss px-3 py-2.5 font-mono text-sm text-paper outline-none focus:border-radar/60"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={onScan}
              className="h-[42px] border border-radar bg-radar px-6 font-mono text-sm font-bold tracking-widest text-abyss transition hover:bg-radar/80"
            >
              SCAN DROPS ⌖
            </button>
          </div>

          <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-3">
            <div>
              <p className="mb-2 font-mono text-[10px] tracking-[0.25em] text-fog2">
                TLD LOCK
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TLD_OPTIONS.map((tld) => {
                  const active = value.tlds.includes(tld);
                  return (
                    <button
                      key={tld}
                      type="button"
                      onClick={() => toggleTld(tld)}
                      className={`border px-2.5 py-1 font-mono text-xs transition ${
                        active
                          ? "border-radar bg-radar-soft text-radar"
                          : "border-line text-fog hover:border-fog/50"
                      }`}
                    >
                      {tld}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.25em] text-fog2">
                MIN DOMAIN RATING — <span className="text-radar">DR {value.minDr}+</span>
              </p>
              <input
                type="range"
                min={0}
                max={80}
                step={1}
                value={value.minDr}
                onChange={(e) => onChange({ ...value, minDr: Number(e.target.value) })}
                className="ds-range mt-3 w-full"
                style={sliderStyle}
              />
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-[0.25em] text-fog2">
                MAX CURRENT BID (USD)
              </p>
              <input
                type="number"
                min={0}
                step={50}
                value={value.maxPriceUsd || ""}
                onChange={(e) =>
                  onChange({ ...value, maxPriceUsd: Number(e.target.value) || 0 })
                }
                placeholder="no limit"
                className="mt-1.5 w-full border border-line bg-abyss px-3 py-2 font-mono text-sm text-paper outline-none placeholder:text-fog2 focus:border-radar/60"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
