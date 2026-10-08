import type { EnrichedDomain } from "@/lib/types";
import { usdMinorToDollars } from "@/lib/format";
import Countdown from "./Countdown";

const STAGE_COLOR: Record<string, string> = {
  pending_delete: "text-amberx border-amberx/40 bg-amberx/10",
  auction: "text-radar border-radar/40 bg-radar/10",
  closeout: "text-fog border-line bg-panel2",
  expired: "text-dangerx border-dangerx/40 bg-dangerx/10",
};

function TickerItem({ d }: { d: EnrichedDomain }) {
  return (
    <a
      href={`/domain/${d.id}`}
      className="flex shrink-0 items-center gap-3 border border-line bg-panel px-4 py-2 transition hover:border-radar/40"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-dangerx ping-dot" />
      <span className="font-mono text-sm font-semibold text-paper">{d.domainName}</span>
      <span className={`border px-1.5 py-0.5 font-mono text-[10px] uppercase ${STAGE_COLOR[d.dropStage] ?? STAGE_COLOR.closeout}`}>
        {d.dropStage.replace("_", " ")}
      </span>
      <Countdown targetIso={d.dropEta} compact className="text-xs" />
      <span className="font-mono text-[11px] text-fog">
        DR {d.domainRating} · bid {usdMinorToDollars(d.currentBidUsd)}
      </span>
    </a>
  );
}

export default function DropTicker({ items }: { items: EnrichedDomain[] }) {
  if (items.length === 0) {
    return (
      <div className="border-y border-line bg-panel px-4 py-2 text-center font-mono text-xs text-fog">
        ⦿ NO IMMINENT DROPS IN THE NEXT 2H — RADAR SWEEPING…
      </div>
    );
  }
  const loop = [...items, ...items];
  return (
    <div className="marquee-wrap overflow-hidden border-y border-line bg-panel/80 py-2.5">
      <div className="marquee-track gap-3 pr-3">
        {loop.map((d, i) => (
          <TickerItem key={`${d.id}-${i}`} d={d} />
        ))}
      </div>
    </div>
  );
}
