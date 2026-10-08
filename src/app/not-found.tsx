export default function NotFound() {
  return (
    <div className="term-grid flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-radar/40">
        <span className="radar-sweep absolute inset-0" />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-radar ping-dot" />
        <span className="absolute inset-6 rounded-full border border-radar/20" />
        <span className="absolute inset-12 rounded-full border border-radar/15" />
      </div>
      <p className="mt-8 font-mono text-6xl font-bold text-radar glow-green">404</p>
      <p className="mt-3 font-mono text-sm tracking-[0.3em] text-fog">
        TARGET NOT FOUND ON RADAR
      </p>
      <p className="mt-2 max-w-md text-sm text-fog2">
        This domain either never existed, already dropped, or was deleted from
        the catalog. Sweep back to the live queue.
      </p>
      <div className="mt-6 flex gap-3">
        <a
          href="/"
          className="border border-radar bg-radar px-5 py-2.5 font-mono text-xs font-bold text-abyss transition hover:bg-radar/80"
        >
          ← BACK TO RADAR
        </a>
        <a
          href="/dashboard"
          className="border border-line px-5 py-2.5 font-mono text-xs text-fog transition hover:border-fog/50 hover:text-paper"
        >
          DASHBOARD
        </a>
      </div>
    </div>
  );
}
