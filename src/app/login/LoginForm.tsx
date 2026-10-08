"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email.includes("@")) {
      setStatus("error");
      setError("Enter a valid email address.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        devLink?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "magic-link-failed");
      }
      setDevLink(data.devLink ?? null);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error && err.message === "rate-limited"
          ? "Too many requests — wait a minute and retry."
          : "Could not send the magic link. Try again.",
      );
    }
  };

  if (status === "sent") {
    return (
      <div className="space-y-4">
        <div className="border border-radar/50 bg-radar-soft p-4">
          <p className="font-mono text-sm text-radar">✓ MAGIC LINK SENT</p>
          <p className="mt-1.5 text-xs text-fog">
            Check <span className="font-mono text-paper">{email}</span>. The link
            is single-use and expires in 15 minutes.
          </p>
        </div>
        {devLink ? (
          <a
            href={devLink}
            className="block border border-amberx bg-amberx px-4 py-2.5 text-center font-mono text-sm font-bold text-abyss transition hover:bg-amberx/80"
          >
            ⚡ QA MODE: OPEN MAGIC LINK INSTANTLY →
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setDevLink(null);
          }}
          className="w-full border border-line px-4 py-2 font-mono text-xs text-fog transition hover:text-paper"
        >
          USE A DIFFERENT EMAIL
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="font-mono text-[10px] tracking-[0.25em] text-fog2">
          OPERATOR EMAIL
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="you@domainfund.io"
          className="mt-1.5 w-full border border-line bg-abyss px-3 py-2.5 font-mono text-sm text-paper outline-none placeholder:text-fog2 focus:border-radar/60"
        />
      </label>
      {status === "error" ? (
        <p className="font-mono text-[11px] text-dangerx">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={submit}
        disabled={status === "sending"}
        className="w-full border border-radar bg-radar px-4 py-2.5 font-mono text-sm font-bold text-abyss transition hover:bg-radar/80 disabled:opacity-60"
      >
        {status === "sending" ? "DISPATCHING LINK…" : "SEND MAGIC LINK →"}
      </button>
    </div>
  );
}
