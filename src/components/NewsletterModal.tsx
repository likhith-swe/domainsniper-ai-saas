"use client";

import { useState } from "react";
import { ModalShell } from "./GlobalModals";

export default function NewsletterModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const subscribe = async () => {
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "modal" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "subscribe-failed");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "subscribe-failed");
    }
  };

  return (
    <ModalShell
      title="The Morning Drop Digest"
      subtitle="Top 10 SniperScore drops of the last 24h, delivered before the auction bots wake up."
      onClose={onClose}
    >
      {status === "done" ? (
        <div className="border border-radar/50 bg-radar-soft p-4 text-center">
          <p className="font-mono text-sm text-radar">✓ SUBSCRIBED</p>
          <p className="mt-2 text-xs text-fog">
            First digest lands tomorrow at 06:00 IST / 00:30 UTC.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void subscribe();
            }}
            placeholder="operator@yourfund.com"
            className="w-full border border-line bg-abyss px-3 py-2.5 font-mono text-sm text-paper outline-none placeholder:text-fog2 focus:border-radar/60"
          />
          {status === "error" ? (
            <p className="font-mono text-[11px] text-dangerx">
              {error === "rate-limited" ? "Too many attempts — try again shortly." : "That email doesn't look right."}
            </p>
          ) : null}
          <button
            type="button"
            onClick={subscribe}
            disabled={status === "saving"}
            className="w-full border border-radar bg-radar px-4 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-radar/80 disabled:opacity-60"
          >
            {status === "saving" ? "SUBSCRIBING…" : "GET THE DIGEST →"}
          </button>
          <p className="text-center font-mono text-[10px] text-fog2">
            No spam. Unsubscribe with one click. ~2,400 domainers read it daily.
          </p>
        </div>
      )}
    </ModalShell>
  );
}
