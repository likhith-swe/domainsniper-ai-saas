"use client";

import { useCallback, useEffect, useState } from "react";
import type { AlertChannel, WatchlistRecord } from "@/lib/types";
import { timeAgo } from "@/lib/format";

const TLD_OPTIONS = [".com", ".ai", ".io", ".co", ".dev", ".org"];
const CHANNELS: AlertChannel[] = ["email", "telegram", "whatsapp"];

const EMPTY = {
  name: "",
  tlds: [] as string[],
  minDr: 40,
  maxPrice: 0,
  channels: ["email"] as AlertChannel[],
};

export default function WatchlistManager({ email }: { email: string }) {
  const [items, setItems] = useState<WatchlistRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlists");
      if (!res.ok) return;
      const data = (await res.json()) as { items: WatchlistRecord[] };
      setItems(data.items);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name || "Untitled tripwire",
          tldFilter: form.tlds,
          minDr: form.minDr,
          maxPriceUsd: form.maxPrice || null,
          channels: form.channels,
        }),
      });
      if (!res.ok) throw new Error("create-failed");
      setForm(EMPTY);
      setFlash("Tripwire armed. Cron dispatch will test-fire within the hour.");
      await refresh();
    } catch {
      setFlash("Failed to arm tripwire — try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setFlash(null), 4000);
    }
  };

  const toggle = async (id: string) => {
    setItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w)),
    );
    await fetch(`/api/watchlists/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((w) => w.id !== id));
    await fetch(`/api/watchlists/${id}`, { method: "DELETE" });
  };

  const toggleIn = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* list */}
      <div>
        <h2 className="font-mono text-xs tracking-[0.3em] text-radar">
          ARMED TRIPWIRES — {email}
        </h2>
        <div className="mt-4 space-y-3">
          {!loaded ? (
            <p className="font-mono text-xs text-fog2">SYNCING TRIPWIRES…</p>
          ) : items.length === 0 ? (
            <div className="border border-dashed border-line bg-panel p-8 text-center">
              <p className="font-mono text-sm text-fog">⦿ NO TRIPWIRES ARMED</p>
              <p className="mt-2 text-xs text-fog2">
                Create your first tripwire on the right — it fires on the next
                cron sweep (hourly) when a matching drop enters the queue.
              </p>
            </div>
          ) : (
            items.map((w) => (
              <div
                key={w.id}
                className={`border bg-panel p-4 ${w.active ? "border-line" : "border-line opacity-55"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-paper">{w.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-fog">
                      {w.tldFilter.length > 0 ? w.tldFilter.join(" ") : "ALL TLDS"} ·
                      DR {w.minDr}+
                      {w.maxPriceUsd !== null ? ` · ≤$${w.maxPriceUsd}` : ""} ·{" "}
                      {w.channels.join(", ")}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-fog2">
                      armed {timeAgo(w.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`border px-2 py-0.5 font-mono text-[10px] ${
                        w.active
                          ? "border-radar/50 text-radar"
                          : "border-line text-fog2"
                      }`}
                    >
                      {w.active ? "● ARMED" : "○ PAUSED"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(w.id)}
                      className="border border-line px-2 py-1 font-mono text-[11px] text-fog transition hover:border-amberx/50 hover:text-amberx"
                    >
                      {w.active ? "PAUSE" : "ARM"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(w.id)}
                      className="border border-line px-2 py-1 font-mono text-[11px] text-fog transition hover:border-dangerx/50 hover:text-dangerx"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* create form */}
      <aside className="h-fit border border-line bg-panel p-5">
        <p className="font-mono text-[10px] tracking-[0.3em] text-fog2">NEW TRIPWIRE</p>
        <div className="mt-4 space-y-4">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. .ai snipers under $200"
            className="w-full border border-line bg-abyss px-3 py-2 font-mono text-sm text-paper outline-none placeholder:text-fog2 focus:border-radar/60"
          />
          <div className="flex flex-wrap gap-1.5">
            {TLD_OPTIONS.map((tld) => (
              <button
                key={tld}
                type="button"
                onClick={() => setForm((f) => ({ ...f, tlds: toggleIn(f.tlds, tld) }))}
                className={`border px-2.5 py-1 font-mono text-xs ${
                  form.tlds.includes(tld)
                    ? "border-radar bg-radar-soft text-radar"
                    : "border-line text-fog"
                }`}
              >
                {tld}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-mono text-[10px] text-fog2">MIN DR</span>
              <input
                type="number"
                min={0}
                max={80}
                value={form.minDr}
                onChange={(e) => setForm({ ...form, minDr: Number(e.target.value) || 0 })}
                className="mt-1 w-full border border-line bg-abyss px-2 py-1.5 font-mono text-sm text-paper outline-none focus:border-radar/60"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] text-fog2">MAX BID $ (0 = ∞)</span>
              <input
                type="number"
                min={0}
                value={form.maxPrice}
                onChange={(e) => setForm({ ...form, maxPrice: Number(e.target.value) || 0 })}
                className="mt-1 w-full border border-line bg-abyss px-2 py-1.5 font-mono text-sm text-paper outline-none focus:border-radar/60"
              />
            </label>
          </div>
          <div className="flex gap-1.5">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, channels: toggleIn(f.channels, c) }))
                }
                className={`border px-2.5 py-1 font-mono text-xs ${
                  form.channels.includes(c)
                    ? "border-amberx bg-amberx/10 text-amberx"
                    : "border-line text-fog"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={create}
            disabled={saving}
            className="w-full border border-radar bg-radar px-4 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-radar/80 disabled:opacity-60"
          >
            {saving ? "ARMING…" : "⌖ ARM TRIPWIRE"}
          </button>
          {flash ? (
            <p className="border border-line bg-panel2 px-3 py-2 font-mono text-[11px] text-fog">
              {flash}
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
