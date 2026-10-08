"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";
import { ModalOpener } from "./GlobalModals";

interface HealthLite {
  db: "postgres" | "memory";
  catalogCount: number;
}

const LINKS = [
  { href: "/#radar", label: "RADAR" },
  { href: "/#snipers", label: "SNIPER LIST" },
  { href: "/#hubs", label: "DROP HUBS" },
  { href: "/#revenue", label: "REVENUE MODEL" },
];

export default function Navigation() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [health, setHealth] = useState<HealthLite | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session")
      .then((r) => r.json() as Promise<{ user: SessionUser | null }>)
      .then((d) => alive && setUser(d.user))
      .catch(() => undefined);
    fetch("/api/health")
      .then((r) => r.json() as Promise<HealthLite>)
      .then((d) => alive && setHealth(d))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-abyss/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="/" className="flex items-center gap-3">
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-radar/40">
            <span className="radar-sweep absolute inset-0" />
            <span className="h-1.5 w-1.5 rounded-full bg-radar ping-dot" />
          </span>
          <span className="leading-none">
            <span className="block text-sm font-bold tracking-[0.18em] text-paper">
              DOMAINSNIPER<span className="text-radar">.AI</span>
            </span>
            <span className="mt-0.5 block font-mono text-[9px] tracking-[0.3em] text-fog2">
              DROP RADAR v2.1
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-5 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[11px] tracking-[0.2em] text-fog transition hover:text-radar"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 border border-line px-2 py-1 font-mono text-[10px] sm:flex"
            title="Data source status"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health?.db === "postgres" ? "bg-radar" : "bg-amberx"
              } ping-dot`}
            />
            {health ? (
              <span className="text-fog">
                {health.db === "postgres" ? "POSTGRES" : "MEMORY"} ·{" "}
                {health.catalogCount} DROPS
              </span>
            ) : (
              <span className="text-fog2">LINKING…</span>
            )}
          </span>

          {user ? (
            <>
              {user.plan === "pro" ? (
                <span className="hidden border border-amberx/50 bg-amberx/10 px-2 py-1 font-mono text-[10px] text-amberx sm:inline">
                  ★ CLUB PRO
                </span>
              ) : null}
              <a
                href="/dashboard"
                className="border border-radar/60 bg-radar-soft px-3 py-1.5 font-mono text-xs font-bold text-radar transition hover:bg-radar/20"
              >
                DASHBOARD
              </a>
              <button
                type="button"
                onClick={signOut}
                className="hidden border border-line px-2.5 py-1.5 font-mono text-xs text-fog transition hover:border-dangerx/50 hover:text-dangerx sm:inline"
              >
                EXIT
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="border border-line px-3 py-1.5 font-mono text-xs text-fog transition hover:border-radar/50 hover:text-radar"
              >
                LOGIN
              </a>
              <ModalOpener
                kind="pricing"
                className="border border-radar bg-radar px-3 py-1.5 font-mono text-xs font-bold text-abyss transition hover:bg-radar/80"
              >
                JOIN CLUB PRO
              </ModalOpener>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
