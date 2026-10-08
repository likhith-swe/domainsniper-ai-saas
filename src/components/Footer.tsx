import { CATEGORY_LABELS } from "@/lib/seo";
import { ModalOpener } from "./GlobalModals";

const HUB_LINKS = [
  { href: "/drops/ai/ai-ml", label: ".ai AI Domains" },
  { href: "/drops/com/fintech", label: ".com Fintech Drops" },
  { href: "/drops/io/devtools", label: ".io Dev Tool Drops" },
  { href: "/drops/org/health", label: ".org Health Drops" },
  { href: "/drops/com/ecommerce", label: ".com E-Commerce Drops" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-panel/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-paper">
            DOMAINSNIPER<span className="text-radar">.AI</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-fog">
            Institutional-grade expired-domain valuation, backlink juice audits
            and drop-catching radar. Monitoring the ICANN pending-delete queue
            24/7 so you never miss a 10-year-old asset with DR 40–80.
          </p>
          <ModalOpener
            kind="newsletter"
            className="mt-4 border border-radar/50 bg-radar-soft px-3 py-2 font-mono text-xs font-bold text-radar transition hover:bg-radar/20"
          >
            ☕ MORNING DROP DIGEST →
          </ModalOpener>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-fog2">DROP HUBS</p>
          <ul className="mt-3 space-y-2">
            {HUB_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-xs text-fog transition hover:text-radar">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-fog2">CATEGORIES</p>
          <ul className="mt-3 space-y-2">
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <li key={slug}>
                <a href={`/#radar`} className="text-xs text-fog transition hover:text-radar">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-fog2">INTEL</p>
          <ul className="mt-3 space-y-2 text-xs text-fog">
            <li>
              <a href="/#revenue" className="transition hover:text-radar">
                How we make money
              </a>
            </li>
            <li>
              <a href="/dashboard" className="transition hover:text-radar">
                Sniper dashboard
              </a>
            </li>
            <li>
              <a href="/watchlists" className="transition hover:text-radar">
                Tripwire manager
              </a>
            </li>
            <li>
              <a href="/login" className="transition hover:text-radar">
                Magic-link login
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-5">
          <p className="font-mono text-[10px] leading-relaxed text-fog2">
            MONETIZATION DISCLOSURE — “Claim drop” buttons are affiliate referral
            links to registrars (GoDaddy, Namecheap, Dynadot, Porkbun). We earn a
            commission on registrations and backorders at no extra cost to you.
            SniperScore and valuations are algorithmic estimates, not financial
            advice. Not affiliated with ICANN or any registry.
          </p>
          <p className="font-mono text-[10px] text-fog2">
            © {new Date().getFullYear()} DomainSniper AI · built for domainers, by domainers
          </p>
        </div>
      </div>
    </footer>
  );
}
