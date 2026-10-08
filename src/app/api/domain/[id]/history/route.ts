import { NextResponse } from "next/server";
import { getDomainHistory } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { domain, history } = await getDomainHistory(id);
  if (!domain || !history) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json({
    id: domain.id,
    domainName: domain.domainName,
    estValuationUsd: domain.estValuationUsd,
    currentBidUsd: domain.currentBidUsd,
    watchers: domain.historicalTrend.watchers,
    monthlySearches: domain.historicalTrend.monthlySearches,
    history,
  });
}
