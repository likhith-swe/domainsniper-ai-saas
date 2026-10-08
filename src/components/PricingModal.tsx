"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";
import { BILLING } from "@/lib/env-client";
import { ModalShell, SandboxActivateButton } from "./GlobalModals";

const FREE_FEATURES = [
  "Browse live drop radar (15-min delay)",
  "SniperScore visible on cards",
  "3 watchlist tripwires",
  "Email digest (weekly)",
];

const PRO_FEATURES = [
  "Zero-delay radar + sub-second tripwires",
  "Telegram, WhatsApp & email alert channels",
  "Full backlink vault + .edu/.gov breakdown",
  "Valuation tape & 60-day interest history",
  "Unlimited tripwires + auction close-out alerts",
  "Appraisal certificate exports (OG badges)",
];

export default function PricingModal({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [busy, setBusy] = useState<"razorpay" | "stripe" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json() as Promise<{ user: SessionUser | null }>)
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const checkout = async (provider: "razorpay" | "stripe") => {
    setBusy(provider);
    setNotice(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = (await res.json()) as {
        url?: string;
        mode?: string;
        message?: string;
      };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data.message ?? "Billing sandbox active — use 1-click VIP below.");
    } catch {
      setNotice("Checkout unavailable right now — use the sandbox activator.");
    } finally {
      setBusy(null);
    }
  };

  const isPro = user?.plan === "pro";

  return (
    <ModalShell
      wide
      title="Club Pro — the sniper's edge"
      subtitle="Institutional drop data without the institutional invoice."
      onClose={onClose}
    >
      {isPro ? (
        <div className="border border-radar/50 bg-radar-soft p-4 text-center font-mono text-sm text-radar">
          ✓ CLUB PRO ACTIVE — all tripwires running at zero delay.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-line bg-panel2 p-4">
            <p className="font-mono text-[10px] tracking-[0.25em] text-fog2">SCOUT</p>
            <p className="mt-1 text-2xl font-bold text-paper">Free</p>
            <ul className="mt-4 space-y-2 text-xs text-fog">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-fog2">–</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative border border-amberx/50 bg-panel2 p-4">
            <span className="absolute -top-2.5 right-3 border border-amberx/60 bg-abyss px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-amberx">
              MOST LETHAL
            </span>
            <p className="font-mono text-[10px] tracking-[0.25em] text-amberx">CLUB PRO</p>
            <p className="mt-1 text-2xl font-bold text-paper">
              ₹499<span className="text-sm text-fog">/mo</span>{" "}
              <span className="text-fog2">·</span> $9
              <span className="text-sm text-fog">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-xs text-paper">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-radar">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!isPro ? (
        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => checkout("razorpay")}
              className="border border-radar bg-radar px-4 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-radar/80 disabled:opacity-60"
            >
              {busy === "razorpay" ? "OPENING…" : "PAY ₹499 — RAZORPAY (IN)"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => checkout("stripe")}
              className="border border-amberx bg-amberx px-4 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-amberx/80 disabled:opacity-60"
            >
              {busy === "stripe" ? "OPENING…" : "PAY $9 — STRIPE (GLOBAL)"}
            </button>
          </div>
          {notice ? (
            <p className="border border-amberx/40 bg-amberx/10 px-3 py-2 font-mono text-[11px] text-amberx">
              {notice}
            </p>
          ) : null}
          {BILLING.sandboxAvailable ? <SandboxActivateButton className="w-full" /> : null}
          <p className="text-center font-mono text-[10px] text-fog2">
            {user
              ? `Signed in as ${user.email}`
              : "You'll be asked to sign in after checkout — or sign in first."}
          </p>
        </div>
      ) : null}
    </ModalShell>
  );
}
