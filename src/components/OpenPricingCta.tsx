"use client";

import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/types";
import { ModalOpener } from "./GlobalModals";

export default function OpenPricingCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro" | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json() as Promise<{ user: SessionUser | null }>)
      .then((d) => setPlan(d.user?.plan ?? "free"))
      .catch(() => setPlan("free"));

    const onScroll = () => {
      if (window.scrollY > 650) setVisible(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible || dismissed || plan === "pro") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amberx/40 bg-abyss/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <p className="hidden font-mono text-xs text-fog sm:block">
          <span className="text-amberx">⌖ 12 snipers</span> joined Club Pro today —
          sub-second tripwires, full backlink vault, zero-delay radar.
        </p>
        <p className="font-mono text-xs text-amberx sm:hidden">⌖ Club Pro — ₹499/$9</p>
        <div className="flex shrink-0 items-center gap-2">
          <ModalOpener
            kind="pricing"
            className="border border-amberx bg-amberx px-4 py-1.5 font-mono text-xs font-bold text-abyss transition hover:bg-amberx/80"
          >
            UPGRADE →
          </ModalOpener>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss upgrade bar"
            className="border border-line px-2 py-1.5 font-mono text-xs text-fog transition hover:text-dangerx"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
