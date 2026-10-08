"use client";

import { useId } from "react";
import { usdMinorToDollars } from "@/lib/format";

const W = 720;
const H = 230;
const PAD_X = 8;
const PAD_TOP = 18;
const PAD_BOTTOM = 26;

function scaleSeries(values: number[], min: number, max: number): number[] {
  const span = max - min || 1;
  return values.map(
    (v) => PAD_TOP + (1 - (v - min) / span) * (H - PAD_TOP - PAD_BOTTOM),
  );
}

export default function ValuationChart({
  valuation,
  interest,
  labels,
  showLegend = true,
}: {
  valuation: number[];
  interest: number[];
  labels?: string[];
  showLegend?: boolean;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (valuation.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center border border-dashed border-line font-mono text-xs text-fog">
        NO HISTORY TAPE AVAILABLE
      </div>
    );
  }

  const vMin = Math.min(...valuation) * 0.92;
  const vMax = Math.max(...valuation) * 1.05;
  const xs = valuation.map(
    (_, i) => PAD_X + (i / (valuation.length - 1)) * (W - PAD_X * 2),
  );
  const vYs = scaleSeries(valuation, vMin, vMax);
  const iYs = scaleSeries(interest, 0, 100);

  const line = (ys: number[]) =>
    xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const valuationPath = line(vYs);
  const interestPath = line(iYs);
  const areaPath = `${valuationPath} L${xs[xs.length - 1].toFixed(1)},${H - PAD_BOTTOM} L${xs[0].toFixed(1)},${H - PAD_BOTTOM} Z`;

  const lastValuation = valuation[valuation.length - 1];
  const delta = valuation.length > 1 ? ((lastValuation - valuation[0]) / valuation[0]) * 100 : 0;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Historical valuation and search interest"
      >
        <defs>
          <linearGradient id={`vg-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffb224" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffb224" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
            y2={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
            stroke="#1b2b23"
            strokeDasharray="3 6"
          />
        ))}
        <path d={areaPath} fill={`url(#vg-${gid})`} />
        <path d={interestPath} fill="none" stroke="#2ee68d" strokeWidth="1.6" strokeOpacity="0.85" />
        <path d={valuationPath} fill="none" stroke="#ffb224" strokeWidth="2.2" />
        <circle cx={xs[xs.length - 1]} cy={vYs[vYs.length - 1]} r="4" fill="#ffb224" />
        {labels && labels.length > 5 ? (
          <>
            <text x={xs[0]} y={H - 8} fill="#5f7268" fontSize="10" fontFamily="monospace">
              {labels[0]}
            </text>
            <text x={xs[xs.length - 1]} y={H - 8} fill="#5f7268" fontSize="10" fontFamily="monospace" textAnchor="end">
              {labels[labels.length - 1]}
            </text>
          </>
        ) : null}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {showLegend ? (
          <div className="flex items-center gap-4 font-mono text-[11px] text-fog">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 bg-amberx" /> valuation tape
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 bg-radar" /> search interest
            </span>
          </div>
        ) : (
          <span />
        )}
        <div className="font-mono text-[11px]">
          <span className="text-fog">current est.</span>{" "}
          <span className="text-amberx">{usdMinorToDollars(lastValuation)}</span>{" "}
          <span className={delta >= 0 ? "text-radar" : "text-dangerx"}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% / 60d
          </span>
        </div>
      </div>
    </div>
  );
}
