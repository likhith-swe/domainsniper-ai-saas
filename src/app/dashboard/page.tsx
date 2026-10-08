import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DomainGrid from "@/components/DomainGrid";
import { SandboxActivateButton } from "@/components/GlobalModals";
import WatchlistManager from "@/components/WatchlistManager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { BILLING } from "@/lib/env";
import { timeAgo, usdMinorToDollars } from "@/lib/format";
import { listAlertEvents, listDomains, listWatchlists } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Sniper Dashboard",
};

const CHANNEL_ICON: Record<string, string> = {
  telegram: "✈",
  whatsapp: "☎",
  email: "✉",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [radar, watchlists, alerts] = await Promise.all([
    listDomains({ sort: "score", limit: 9 }),
    listWatchlists(user.email),
    listAlertEvents(user.email, 12),
  ]);

  const armed = watchlists.filter((w) => w.active).length;
  const sentCount = alerts.filter((a) => a.status === "sent").length;
  const avgLatency =
    alerts.length > 0
      ? Math.round(alerts.reduce((acc, a) => acc + a.latencyMs, 0) / alerts.length)
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-radar">
            // SNIPER DECK
          </p>
          <h1 className="mt-2 text-3xl font-bold text-paper">
            Welcome back, <span className="font-mono text-radar">{user.email}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`border px-3 py-1.5 font-mono text-xs ${
              user.plan === "pro"
                ? "border-amberx/60 bg-amberx/10 text-amberx"
                : "border-line text-fog"
            }`}
          >
            {user.plan === "pro" ? "★ CLUB PRO — ZERO DELAY" : "SCOUT — FREE TIER"}
          </span>
          <a
            href="/watchlists"
            className="border border-line px-3 py-1.5 font-mono text-xs text-fog transition hover:border-radar/50 hover:text-radar"
          >
            TRIPWIRE MANAGER →
          </a>
        </div>
      </div>

      {/* stat strip */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="border border-line bg-panel p-4">
          <p className="font-mono text-[10px] tracking-[0.25em] text-fog2">TRACKED DROPS</p>
          <p className="mt-1 font-mono text-3xl font-bold text-radar">{radar.total}</p>
        </div>
        <div className="border border-line bg-panel p-4">
          <p className="font-mono text-[10px] tracking-[0.25em] text-fog2">ARMED TRIPWIRES</p>
          <p className="mt-1 font-mono text-3xl font-bold text-amberx">{armed}</p>
        </div>
        <div className="border border-line bg-panel p-4">
          <p className="font-mono text-[10px] tracking-[0.25em] text-fog2">ALERTS DISPATCHED</p>
          <p className="mt-1 font-mono text-3xl font-bold text-paper">{alerts.length}</p>
        </div>
        <div className="border border-line bg-panel p-4">
          <p className="font-mono text-[10px] tracking-[0.25em] text-fog2">AVG DELIVERY</p>
          <p className="mt-1 font-mono text-3xl font-bold text-paper">
            {avgLatency}<span className="text-sm text-fog">ms</span>
          </p>
        </div>
      </div>

      {!BILLING.stripeConfigured && !BILLING.razorpayConfigured ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-amberx/40 bg-amberx/5 p-4">
          <p className="font-mono text-xs text-amberx">
            ⚡ BILLING SANDBOX — live Stripe/Razorpay keys not detected in this
            environment. Use the QA activator to unlock Club Pro instantly.
          </p>
          {user.plan !== "pro" ? (
            <SandboxActivateButton label="⚡ ACTIVATE VIP (SANDBOX)" />
          ) : (
            <span className="font-mono text-xs text-radar">✓ VIP ACTIVE</span>
          )}
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* radar picks */}
        <section>
          <h2 className="font-mono text-xs tracking-[0.3em] text-radar">
            ▛ TODAY'S TOP SNIPERSCORE PICKS
          </h2>
          <div className="mt-4">
            <DomainGrid initialItems={radar.items} initialSource={radar.source} />
          </div>
        </section>

        {/* alerts feed */}
        <section>
          <h2 className="font-mono text-xs tracking-[0.3em] text-amberx">
            ▛ TRIPWIRE EVENT FEED
          </h2>
          <div className="mt-4 space-y-2.5">
            {alerts.length === 0 ? (
              <div className="border border-dashed border-line bg-panel p-6 text-center">
                <p className="font-mono text-xs text-fog">⦿ NO EVENTS YET</p>
                <p className="mt-2 text-[11px] text-fog2">
                  Arm a tripwire, then run the cron sweep (POST /api/cron/refresh-drops)
                  or wait for the hourly cycle.
                </p>
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="border border-line bg-panel p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs font-bold text-paper">
                      {CHANNEL_ICON[a.channel] ?? "•"} {a.domainName ?? a.domainId}
                    </p>
                    <span
                      className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase ${
                        a.status === "sent"
                          ? "border-radar/50 text-radar"
                          : a.status === "simulated"
                            ? "border-amberx/50 text-amberx"
                            : "border-dangerx/50 text-dangerx"
                      }`}
                    >
                      {a.status} · {a.latencyMs}ms
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-fog2">
                    {a.message}
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-fog2">{timeAgo(a.firedAt)}</p>
                </div>
              ))
            )}
          </div>

          <h2 className="mt-8 font-mono text-xs tracking-[0.3em] text-fog">
            ▛ SAVED VALUATIONS
          </h2>
          <div className="mt-3 space-y-2">
            {radar.items.slice(0, 5).map((d) => (
              <a
                key={d.id}
                href={`/domain/${d.id}`}
                className="flex items-center justify-between border border-line bg-panel px-3 py-2 transition hover:border-radar/40"
              >
                <span className="truncate font-mono text-xs text-paper">{d.domainName}</span>
                <span className="ml-2 shrink-0 font-mono text-[10px] text-amberx">
                  {usdMinorToDollars(d.estValuationUsd)}
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <WatchlistManager email={user.email} />
      </div>
    </div>
  );
}
