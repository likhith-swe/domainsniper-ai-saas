import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";
import { createWatchlist, listWatchlists } from "@/lib/queries";
import type { AlertChannel } from "@/lib/types";

export const dynamic = "force-dynamic";

const CHANNELS = new Set<string>(["email", "telegram", "whatsapp"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "auth-required" }, { status: 401 });
  }
  const items = await listWatchlists(user.email);
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "auth-required" }, { status: 401 });
  }
  const rl = rateLimit(`wl-create:${user.email}:${ipFromRequest(req)}`, 20, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim().slice(0, 80)
      : "Untitled tripwire";
  const tldFilter = Array.isArray(body.tldFilter)
    ? (body.tldFilter as unknown[])
        .filter((t): t is string => typeof t === "string")
        .map((t) => (t.startsWith(".") ? t : `.${t}`))
        .slice(0, 10)
    : [];
  const minDr = Math.min(
    80,
    Math.max(0, Math.floor(Number(body.minDr) || 0)),
  );
  const maxPriceRaw = body.maxPriceUsd;
  const maxPriceUsd =
    maxPriceRaw === null || maxPriceRaw === undefined || Number.isNaN(Number(maxPriceRaw))
      ? null
      : Math.max(0, Math.floor(Number(maxPriceRaw)));
  const channels = Array.isArray(body.channels)
    ? ([...new Set((body.channels as unknown[]).filter((c): c is AlertChannel => typeof c === "string" && CHANNELS.has(c)))] as AlertChannel[])
    : [];
  if (channels.length === 0) channels.push("email");

  const record = await createWatchlist({
    userEmail: user.email,
    name,
    tldFilter,
    minDr,
    maxPriceUsd,
    channels,
    active: true,
  });
  return NextResponse.json({ ok: true, item: record }, { status: 201 });
}
