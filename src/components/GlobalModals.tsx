"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { EnrichedDomain } from "@/lib/types";
import BacklinkModal from "./BacklinkModal";
import NewsletterModal from "./NewsletterModal";
import PricingModal from "./PricingModal";
import WatchlistModal from "./WatchlistModal";

export type ModalKind = "pricing" | "newsletter" | "watchlist" | "backlinks";

export interface ModalPayload {
  domain?: EnrichedDomain;
  tld?: string;
}

interface ModalState {
  kind: ModalKind;
  payload: ModalPayload;
}

interface ModalContextValue {
  state: ModalState | null;
  open: (kind: ModalKind, payload?: ModalPayload) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue>({
  state: null,
  open: () => undefined,
  close: () => undefined,
});

export function useModals(): ModalContextValue {
  return useContext(ModalContext);
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`clip-terminal rise relative max-h-[86vh] w-full overflow-y-auto border border-line bg-panel p-6 shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-radar">
              // DOMAINSNIPER
            </p>
            <h3 className="mt-1 text-lg font-bold text-paper">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-fog">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 border border-line px-2 py-1 font-mono text-xs text-fog transition hover:border-dangerx/60 hover:text-dangerx"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Inline button that opens one of the global modals. */
export function ModalOpener({
  kind,
  payload,
  className = "",
  children,
}: {
  kind: ModalKind;
  payload?: ModalPayload;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useModals();
  return (
    <button
      type="button"
      onClick={() => open(kind, payload)}
      className={className}
    >
      {children}
    </button>
  );
}

/** 1-click VIP sandbox activation (QA path when billing keys are absent). */
export function SandboxActivateButton({
  className = "",
  label = "⚡ QA: 1-click VIP activation",
}: {
  className?: string;
  label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const activate = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/billing/sandbox-activate", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("activation-failed");
      setStatus("done");
      window.setTimeout(() => window.location.reload(), 900);
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className={`border border-radar/40 bg-radar-soft px-4 py-2 text-center font-mono text-xs text-radar ${className}`}>
        ✓ VIP ACTIVATED — reloading console…
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={activate}
      disabled={status === "loading"}
      className={`border border-amberx/40 bg-amberx/10 px-4 py-2 font-mono text-xs text-amberx transition hover:bg-amberx/20 disabled:opacity-60 ${className}`}
    >
      {status === "loading" ? "ACTIVATING…" : status === "error" ? "RETRY ACTIVATION" : label}
    </button>
  );
}

export default function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState | null>(null);

  const open = useCallback((kind: ModalKind, payload: ModalPayload = {}) => {
    setState({ kind, payload });
  }, []);

  const close = useCallback(() => setState(null), []);

  return (
    <ModalContext.Provider value={{ state, open, close }}>
      {children}
      {state?.kind === "pricing" ? <PricingModal onClose={close} /> : null}
      {state?.kind === "newsletter" ? <NewsletterModal onClose={close} /> : null}
      {state?.kind === "watchlist" ? (
        <WatchlistModal onClose={close} payload={state.payload} />
      ) : null}
      {state?.kind === "backlinks" ? (
        <BacklinkModal onClose={close} domain={state.payload.domain ?? null} />
      ) : null}
    </ModalContext.Provider>
  );
}
