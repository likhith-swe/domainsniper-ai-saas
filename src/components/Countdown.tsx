"use client";

import { useEffect, useState } from "react";
import { countdownParts, pad2 } from "@/lib/format";

export default function Countdown({
  targetIso,
  compact = false,
  className = "",
}: {
  targetIso: string;
  compact?: boolean;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <span className={`font-mono tabular-nums text-fog ${className}`}>
        --:--:--
      </span>
    );
  }

  const parts = countdownParts(targetIso, now);
  if (parts.expired) {
    return (
      <span className={`font-mono font-bold text-dangerx ${className}`}>
        DROPPED
      </span>
    );
  }

  const urgent = parts.totalMs < 3_600_000;
  const color = urgent ? "text-dangerx" : "text-radar";
  const body = `${parts.days > 0 ? `${parts.days}d ` : ""}${pad2(parts.hours)}:${pad2(
    parts.minutes,
  )}:${pad2(parts.seconds)}`;

  if (compact) {
    return (
      <span className={`font-mono tabular-nums ${color} ${className}`}>{body}</span>
    );
  }

  return (
    <span
      className={`font-mono tabular-nums tracking-tight ${color} ${className}`}
      title="Time remaining until ICANN release"
    >
      <span className="text-fog2">T−</span>
      {body}
    </span>
  );
}
