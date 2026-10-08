import type { EnrichedDomain } from "@/lib/types";
import DomainCard from "@/components/DomainCard";
import { ModalOpener } from "@/components/GlobalModals";
import RadarConsole from "@/components/RadarConsole";
import RevenueModel from "@/components/RevenueModel";
import { msUntil } from "@/lib/format";
import { listDomains } from "@/lib/queries";

const HUB_CARDS = [
  { href: "/drops/ai/ai-ml", tld: ".ai", label: "AI & Machine Learning", category: "ai-ml" },
  { href: "/drops/com/fintech", tld: ".com", label: "Fintech & Payments", category: "fintech" },
  { href: "/drops/io/devtools", tld: ".io", label: "Dev Tools & Cloud", category: "devtools" },
  { href: "/drops/org/health", tld: ".org", label: "Health & Biotech", category: "health" },
  { href: "/drops/com/ecommerce", tld: ".com", label: "E-Commerce & Consumer", category: "ecommerce" },
] as const;

const PRICING_ROWS = [
  { feature: "Radar refresh latency", free: "15 min", pro: "sub-second" },
  { feature: "Tripwire watchlists", free: "3", pro: "unlimited" },
  { feature: "Alert channels", free: "email digest", pro: "Telegram + WhatsApp + email" },
  { feature: "Backlink vault depth", free: "top 3 links", pro: "full .edu/.gov breakdown" },
  { feature: "Valuation tape (60d)", free: "—", pro: "✓" },
  { feature: "Auction close-out alerts", free: "—", pro: "✓" },
  { feature: "Appraisal certificates", free: "—", pro: "✓" },
] as const;

export default async function HomePage() {
  const res = await listDomains({ sort: "score", limit: 100 });
  const all = res.items;
  const now = Date.now();

  const tickerItems = all
    .filter((d) => {
      const ms = msUntil(d.dropEta, now);
      return ms > 0 && ms < 2 * 3_600_000 && d.dropStage !== "expired";
    })
    .sort((a, b) => new Date(a.dropEta).getTime() - new Date(b.dropEta).getTime());

  const snipers = all.filter((d) => d.score.isHighValueSniper);
  const stats = {
    total: all.length,
    snipers: snipers.length,
    imminent: tickerItems.length,
  };

  const countByCategory = (category: string): number =>
    all.filter((d) => d.category === category).length;

  return (
    <>
      <RadarConsole
        initialItems={all.slice(0, 9)}
        initialSource={res.source}
        stats={stats}
        tickerItems={tickerItems}
      />

      {/* sniper spotlight */}
      <section id="snipers" className="scroll-mt-20 border-t border-line bg-panel/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs tracking-[0.3em] text-amberx">
                ▛ HIGH-VALUE SNIPER LIST
              </p>
              <h2 className="mt-2 text-3xl font-bold text-paper">
                Score ≥ 82 <span className="text-fog2">and</span> valuation ≥ $1,200
              </h2>
            </div>
            <p className="font-mono text-xs text-fog">
              {snipers.length} targets qualify right now
            </p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {snipers.slice(0, 3).map((d: EnrichedDomain) => (
              <DomainCard key={d.id} d={d} />
            ))}
          </div>
        </div>
      </section>

      {/* hubs */}
      <section id="hubs" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="font-mono text-xs tracking-[0.3em] text-radar">▛ DROP HUBS</p>
          <h2 className="mt-2 text-3xl font-bold text-paper">
            Programmatic radars by TLD × niche
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {HUB_CARDS.map((h) => (
              <a
                key={h.href}
                href={h.href}
                className="card-glow border border-line bg-panel p-5 transition"
              >
                <p className="font-mono text-2xl font-bold text-radar">{h.tld}</p>
                <p className="mt-2 text-sm font-semibold text-paper">{h.label}</p>
                <p className="mt-1 font-mono text-[11px] text-fog2">
                  {countByCategory(h.category)} live drops →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* pricing comparison */}
      <section id="pricing" className="scroll-mt-20 border-t border-line bg-panel/30">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <p className="font-mono text-xs tracking-[0.3em] text-amberx">▛ PRICING</p>
          <h2 className="mt-2 text-3xl font-bold text-paper">Scout free. Snipe with Club Pro.</h2>
          <div className="mt-6 overflow-x-auto border border-line">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-panel font-mono text-[11px] tracking-[0.2em] text-fog2">
                  <th className="px-4 py-3 text-left">CAPABILITY</th>
                  <th className="px-4 py-3 text-center">SCOUT · FREE</th>
                  <th className="px-4 py-3 text-center text-amberx">CLUB PRO · ₹499 / $9 mo</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 text-fog">{row.feature}</td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-fog2">
                      {row.free}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-xs text-radar">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ModalOpener
              kind="pricing"
              className="border border-amberx bg-amberx px-6 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-amberx/80"
            >
              JOIN CLUB PRO →
            </ModalOpener>
            <ModalOpener
              kind="newsletter"
              className="border border-line px-6 py-2.5 font-mono text-sm text-fog transition hover:border-radar/50 hover:text-radar"
            >
              TRY THE FREE DIGEST FIRST
            </ModalOpener>
          </div>
        </div>
      </section>

      <RevenueModel />

      {/* digest strip */}
      <section className="term-grid border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-radar">▛ 06:00 IST / 00:30 UTC</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold text-paper">
            The top 10 drops of the last 24 hours, in your inbox before the bots wake up.
          </h2>
          <ModalOpener
            kind="newsletter"
            className="mt-6 border border-radar bg-radar px-8 py-3 font-mono text-sm font-bold text-abyss transition hover:bg-radar/80"
          >
            SUBSCRIBE TO THE MORNING DROP DIGEST →
          </ModalOpener>
        </div>
      </section>
    </>
  );
}
