"use client";

import { useEffect, useState } from "react";
import type { AlertChannel, SessionUser } from "@/lib/types";
import type { ModalPayload } from "./GlobalModals";
import { ModalShell } from "./GlobalModals";

const TLD_OPTIONS = [".com", ".ai", ".io", ".co", ".dev", ".org"];
const CHANNELS: { value: AlertChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
];

export default function WatchlistModal({
  onClose,
  payload,
}: {
  onClose: () => void;
  payload: ModalPayload;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState(
    payload.domain ? `Tripwire: ${payload.domain.tld} snipers` : "My drop tripwire",
  );
  const [tlds, setTlds] = useState<string[]>(payload.tld ? [payload.tld] : []);
  const [minDr, setMinDr] = useState(payload.domain ? Math.max(0, payload.domain.domainRating - 10) : 45);
  const [maxPrice, setMaxPrice] = useState(500);
  const [channels, setChannels] = useState<AlertChannel[]>(["email"]);
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json() as Promise<{ user: SessionUser | null }>)
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const save = async () => {
    if (!user) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          tldFilter: tlds,
          minDr,
          maxPriceUsd: maxPrice || null,
          channels: channels.length > 0 ? channels : ["email"],
        }),
      });
      if (!res.ok) throw new Error("save-failed");
      setStatus("done");
      setTimeout(onClose, 900);
    } catch {
      setStatus("error");
    }
  };

  return (
    <ModalShell
      title="Arm a tripwire"
      subtitle={
        payload.domain
          ? `Pre-filled for drops similar to ${payload.domain.domainName}`
          : "Fires sub-second alerts when a matching drop enters the queue"
      }
      onClose={onClose}
    >
      {checked && !user ? (
        <div className="border border-line bg-panel2 p-4 text-center">
          <p className="font-mono text-xs text-fog">
            AUTHENTICATION REQUIRED TO ARM TRIPWIRES
          </p>
          <a
            href="/login"
            className="mt-3 inline-block border border-radar bg-radar px-4 py-2 font-mono text-xs font-bold text-abyss"
          >
            SIGN IN WITH MAGIC LINK →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] tracking-[0.25em] text-fog2">TRIPWIRE NAME</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full border border-line bg-abyss px-3 py-2 font-mono text-sm text-paper outline-none focus:border-radar/60"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-[0.25em] text-fog2">
              TLD LOCK <span className="text-fog2">(empty = all)</span>
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TLD_OPTIONS.map((tld) => (
                <button
                  key={tld}
                  type="button"
                  onClick={() => setTlds((prev) => toggle(prev, tld))}
                  className={`border px-2.5 py-1 font-mono text-xs ${
                    tlds.includes(tld)
                      ? "border-radar bg-radar-soft text-radar"
                      : "border-line text-fog"
                  }`}
                >
                  {tld}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] tracking-[0.25em] text-fog2">MIN DR</label>
              <input
                type="number"
                min={0}
                max={80}
                value={minDr}
                onChange={(e) => setMinDr(Number(e.target.value) || 0)}
                className="mt-1.5 w-full border border-line bg-abyss px-3 py-2 font-mono text-sm text-paper outline-none focus:border-radar/60"
              />
            </div>
            <div>
              <label className="font-mono text-[10px] tracking-[0.25em] text-fog2">MAX BID (USD)</label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
                className="mt-1.5 w-full border border-line bg-abyss px-3 py-2 font-mono text-sm text-paper outline-none focus:border-radar/60"
              />
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] tracking-[0.25em] text-fog2">ALERT CHANNELS</label>
            <div className="mt-1.5 flex gap-1.5">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setChannels((prev) => toggle(prev, c.value))}
                  className={`border px-2.5 py-1 font-mono text-xs ${
                    channels.includes(c.value)
                      ? "border-amberx bg-amberx/10 text-amberx"
                      : "border-line text-fog"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={status === "saving"}
            className="w-full border border-radar bg-radar px-4 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-radar/80 disabled:opacity-60"
          >
            {status === "saving"
              ? "ARMING…"
              : status === "done"
                ? "✓ TRIPWIRED ARMED"
                : status === "error"
                  ? "RETRY"
                  : "⌖ ARM TRIPWIRE"}
          </button>
        </div>
      )}
    </ModalShell>
  );
}
