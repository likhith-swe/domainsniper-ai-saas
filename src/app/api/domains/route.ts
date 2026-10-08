import { NextResponse, type NextRequest } from "next/server";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";
import { listDomains } from "@/lib/queries";
import type { DomainCategory, DomainFilters, DropStage, SortKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set<string>([
  "ai-ml",
  "fintech",
  "health",
  "devtools",
  "ecommerce",
]);
const STAGES = new Set<string>(["pending_delete", "auction", "closeout", "expired"]);
const SORTS = new Set<string>([
  "score",
  "ending",
  "price_asc",
  "price_desc",
  "dr",
  "valuation",
]);

export async function GET(req: NextRequest) {
  const rl = rateLimit(`domains:${ipFromRequest(req)}`, 240, 10_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const intOr = (v: string | null, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  };

  const tldParam = sp.get("tld");
  const filters: DomainFilters = {
    q: sp.get("q")?.slice(0, 80) ?? undefined,
    tlds: tldParam
      ? tldParam
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 10)
          .map((t) => (t.startsWith(".") ? t : `.${t}`))
      : undefined,
    minDr: Math.min(80, intOr(sp.get("minDr"), 0)),
    maxPriceUsd: Math.min(1_000_000, intOr(sp.get("maxPrice"), 0)) || undefined,
    sort: (SORTS.has(sp.get("sort") ?? "") ? sp.get("sort") : "score") as SortKey,
    limit: Math.min(100, intOr(sp.get("limit"), 50)),
    offset: intOr(sp.get("offset"), 0),
  };

  const category = sp.get("category");
  if (category && CATEGORIES.has(category)) {
    filters.category = category as DomainCategory;
  }
  const stage = sp.get("stage");
  if (stage && STAGES.has(stage)) {
    filters.stage = stage as DropStage;
  }

  const result = await listDomains(filters);
  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
