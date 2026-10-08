/** Currency, time and domain formatting helpers. */

export function usdMinorToDollars(minor: number): string {
  const dollars = minor / 100;
  return `$${Math.round(dollars).toLocaleString("en-US")}`;
}

export function usdMinorToNumber(minor: number): number {
  return Math.round(minor / 100);
}

export function inrMinorToRupees(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export function msUntil(iso: string, now = Date.now()): number {
  return new Date(iso).getTime() - now;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  totalMs: number;
}

export function countdownParts(targetIso: string, now = Date.now()): CountdownParts {
  const totalMs = Math.max(0, new Date(targetIso).getTime() - now);
  const seconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    expired: totalMs <= 0,
    totalMs,
  };
}

export function shortEta(iso: string, now = Date.now()): string {
  const ms = msUntil(iso, now);
  if (ms <= 0) return "dropped";
  const p = countdownParts(iso, now);
  if (p.days > 0) return `in ${p.days}d ${p.hours}h`;
  if (p.hours > 0) return `in ${p.hours}h ${p.minutes}m`;
  return `in ${p.minutes}m`;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function cleanDomainLabel(domainName: string): string {
  return domainName.split(".")[0];
}

export function pct(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}
