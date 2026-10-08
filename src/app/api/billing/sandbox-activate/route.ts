import { NextResponse } from "next/server";
import {
  readSessionCookie,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  signSession,
} from "@/lib/auth/session";
import { isValidEmail } from "@/lib/format";
import { upsertProfile, upsertSubscription } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** 1-click VIP test activation for QA — zero-config Club Pro. */
export async function POST(req: Request) {
  const session = await readSessionCookie();

  let email = session?.email ?? "";
  if (!email) {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      if (typeof body.email === "string" && isValidEmail(body.email)) {
        email = body.email.trim().toLowerCase();
      }
    } catch {
      // no body — fall through to QA identity
    }
  }
  if (!email) email = "qa.operator@domainsniper.ai";

  const periodEnd = new Date(Date.now() + 30 * 86_400_000).toISOString();

  try {
    await upsertSubscription({
      userEmail: email,
      provider: "sandbox",
      providerSubId: null,
      plan: "pro",
      status: "active",
      amountMinor: 0,
      currency: "USD",
      currentPeriodEnd: periodEnd,
    });
    await upsertProfile(email, { plan: "pro" });
  } catch {
    // memory fallback already handled inside queries; ignore hard failures
  }

  const token = signSession({
    email,
    name: session?.name,
    plan: "pro",
    vip: true,
  });

  const res = NextResponse.json({
    ok: true,
    email,
    plan: "pro",
    mode: "sandbox",
    currentPeriodEnd: periodEnd,
  });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
