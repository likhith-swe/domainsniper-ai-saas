import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { ENV } from "../env";
import type { SessionUser } from "../types";

export const SESSION_COOKIE = "ds_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAGIC_TTL_MS = 15 * 60 * 1000; // 15 minutes

function b64u(input: Buffer): string {
  return input.toString("base64url");
}

function fromB64u(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function sign(data: string): string {
  return b64u(createHmac("sha256", ENV.sessionSecret).update(data).digest());
}

function safeEqual(a: string, b: string): boolean {
  const ab = fromB64u(a);
  const bb = fromB64u(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Creates a stateless HMAC-SHA256 signed session cookie value. */
export function signSession(
  input: { email: string; name?: string; plan?: "free" | "pro"; vip?: boolean },
  ttlMs: number = SESSION_TTL_MS,
): string {
  const iat = Date.now();
  const payload = b64u(
    Buffer.from(
      JSON.stringify({
        email: input.email.toLowerCase(),
        name: input.name,
        plan: input.plan ?? "free",
        vip: input.vip ?? false,
        iat,
        exp: iat + ttlMs,
      }),
    ),
  );
  return `${payload}.${sign(payload)}`;
}

/** Verifies signature + expiry and returns the session payload. */
export function verifySessionToken(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const parsed = JSON.parse(fromB64u(payload).toString("utf8")) as SessionUser;
    if (!parsed.email || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return {
      email: parsed.email,
      name: parsed.name,
      plan: parsed.plan ?? "free",
      vip: parsed.vip ?? false,
      iat: parsed.iat,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

/** Server-side reader for the current request's session cookie. */
export async function readSessionCookie(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/* ------------------------- magic link tokens ------------------------- */

type MagicGlobal = typeof globalThis & {
  __dsMemUsedMagic?: Set<string>;
};

function usedMagic(): Set<string> {
  const g = globalThis as MagicGlobal;
  if (!g.__dsMemUsedMagic) g.__dsMemUsedMagic = new Set<string>();
  return g.__dsMemUsedMagic;
}

export interface MagicPayload {
  email: string;
  nonce: string;
  exp: number;
}

/** Issues a single-use 15-minute magic-link token. */
export function issueMagicToken(email: string): string {
  const payload = b64u(
    Buffer.from(
      JSON.stringify({
        email: email.toLowerCase(),
        nonce: randomBytes(9).toString("hex"),
        exp: Date.now() + MAGIC_TTL_MS,
      } satisfies MagicPayload),
    ),
  );
  return `${payload}.${sign(payload)}`;
}

/** Verifies + burns a magic token. Returns the email or null. */
export function consumeMagicToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!safeEqual(sig, sign(payload))) return null;
  try {
    const parsed = JSON.parse(fromB64u(payload).toString("utf8")) as MagicPayload;
    if (!parsed.email || !parsed.nonce) return null;
    if (parsed.exp < Date.now()) return null;
    const used = usedMagic();
    if (used.has(parsed.nonce)) return null; // single-use enforcement
    used.add(parsed.nonce);
    if (used.size > 5000) {
      // keep the set bounded — oldest entries fall away naturally via expiry checks
      const first = used.values().next().value;
      if (first) used.delete(first);
    }
    return parsed.email;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
};
