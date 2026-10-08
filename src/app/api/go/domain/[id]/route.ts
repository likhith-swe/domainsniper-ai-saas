import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { readSessionCookie } from "@/lib/auth/session";
import { buildAffiliateUrl } from "@/lib/affiliate";
import { recordAffiliateClick } from "@/lib/queries";
import { getDomain } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Outbound affiliate redirector with click tracking. */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const domain = await getDomain(id);
  const base = new URL(req.url).origin;
  if (!domain) {
    return NextResponse.redirect(base, 302);
  }

  try {
    const session = await readSessionCookie();
    const fwd = req.headers.get("x-forwarded-for") ?? "local";
    const ua = req.headers.get("user-agent") ?? "";
    const ipHash = createHash("sha256").update(`${fwd}|${ua}`).digest("hex");
    await recordAffiliateClick({
      domainId: domain.id,
      domainName: domain.domainName,
      registrar: domain.registrar,
      userEmail: session?.email ?? null,
      ipHash,
    });
  } catch {
    // tracking must never block the redirect
  }

  const target = buildAffiliateUrl(domain.domainName, domain.registrar);
  return NextResponse.redirect(target, 307);
}
