import { NextResponse, type NextRequest } from "next/server";
import {
  consumeMagicToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  signSession,
} from "@/lib/auth/session";
import { getSubscription, upsertProfile } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Consumes the magic token, mints the ds_session cookie, lands on /dashboard. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const email = consumeMagicToken(token);
  const origin = req.nextUrl.origin;

  if (!email) {
    return NextResponse.redirect(`${origin}/login?error=expired`, 303);
  }

  let plan: "free" | "pro" = "free";
  let vip = false;
  try {
    const sub = await getSubscription(email);
    if (sub && sub.status === "active" && sub.plan === "pro") {
      plan = "pro";
      vip = true;
    }
    await upsertProfile(email, { plan });
  } catch {
    // offline-safe: session still works without persistence
  }

  const sessionToken = signSession({ email, plan, vip });
  const res = NextResponse.redirect(`${origin}/dashboard`, 303);
  res.cookies.set(SESSION_COOKIE, sessionToken, SESSION_COOKIE_OPTIONS);
  return res;
}
