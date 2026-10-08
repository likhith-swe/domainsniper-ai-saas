const STREAMS = [
  {
    code: "RS-01",
    name: "Registrar affiliate commissions",
    share: "≈ 46% of revenue",
    detail:
      "Every “Claim drop” button routes through tracked referral links. Registrars pay 20–35% of first-year registration and backorder fees.",
  },
  {
    code: "RS-02",
    name: "Club Pro subscriptions",
    share: "≈ 31% of revenue",
    detail:
      "₹499/mo via Razorpay in India, $9/mo via Stripe globally. Zero-delay radar, multi-channel tripwires and the full backlink vault.",
  },
  {
    code: "RS-03",
    name: "Appraisal certificates",
    share: "≈ 9% of revenue",
    detail:
      "Shareable 1200×630 valuation certificates generated per domain — brokers embed them in listings at $19 a pop.",
  },
  {
    code: "RS-04",
    name: "Morning digest sponsor slots",
    share: "≈ 8% of revenue",
    detail:
      "One sponsor line per daily top-10 drop email, read by ~2,400 active domain investors.",
  },
  {
    code: "RS-05",
    name: "Drop-catching concierge",
    share: "≈ 6% of revenue",
    detail:
      "We catch the drop for you through partner backorder desks — 10% success fee on any acquisition over $1,000.",
  },
];

export default function RevenueModel() {
  return (
    <section id="revenue" className="scroll-mt-20 border-t border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-mono text-xs tracking-[0.3em] text-radar">
          ▛ RADICAL TRANSPARENCY
        </p>
        <h2 className="mt-2 max-w-xl text-3xl font-bold text-paper">
          Exactly how DomainSniper makes money
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-fog">
          Most drop radars hide their incentives. We publish ours — five revenue
          streams, ranked, so you always know why a domain is in front of you.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STREAMS.map((s) => (
            <article key={s.code} className="card-glow border border-line bg-panel p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.25em] text-fog2">
                  {s.code}
                </span>
                <span className="font-mono text-[10px] text-amberx">{s.share}</span>
              </div>
              <h3 className="mt-2 font-semibold text-paper">{s.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-fog">{s.detail}</p>
            </article>
          ))}
          <article className="flex flex-col justify-center border border-dashed border-radar/40 bg-radar-soft/40 p-5">
            <p className="font-mono text-xs leading-relaxed text-radar">
              No pay-to-rank. No registrar kickbacks for featuring specific drops.
              SniperScore is 100% formula — inspect the math on any audit page.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
