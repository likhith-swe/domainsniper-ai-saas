import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createRazorpayPaymentLink,
  createStripeCheckoutSession,
} from "@/lib/billing";
import { BILLING, ENV } from "@/lib/env";

export const dynamic = "force-dynamic";

const SANDBOX_MESSAGE =
  "Live billing keys are not configured in this environment. Use the 1-click VIP sandbox activation to test Club Pro instantly.";

/** Dual-currency checkout router: Razorpay (INR ₹499) or Stripe (USD $9). */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // default provider below
  }
  const provider = body.provider === "razorpay" ? "razorpay" : "stripe";

  if (provider === "razorpay") {
    const user = await getCurrentUser();
    if (user && BILLING.razorpayConfigured) {
      try {
        const link = await createRazorpayPaymentLink(user.email, ENV.appUrl);
        return NextResponse.json({ ok: true, mode: "live", provider, url: link.url });
      } catch {
        // fallback below
      }
    }
    return NextResponse.json({
      ok: true,
      mode: "live",
      provider,
      url: "https://razorpay.me/@NEXVRA",
    });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        mode: "login-required",
        message: "Sign in with a magic link first — your plan attaches to your email.",
      },
      { status: 401 },
    );
  }

  try {
    if (provider === "stripe" && BILLING.stripeConfigured) {
      const url = await createStripeCheckoutSession(user.email, ENV.appUrl);
      if (url) {
        return NextResponse.json({ ok: true, mode: "live", provider, url });
      }
    }
  } catch {
    return NextResponse.json({
      ok: false,
      mode: "sandbox",
      message: "Payment provider rejected the request — falling back to sandbox.",
      activateUrl: "/api/billing/sandbox-activate",
    });
  }

  return NextResponse.json({
    ok: true,
    mode: "sandbox",
    message: SANDBOX_MESSAGE,
    activateUrl: "/api/billing/sandbox-activate",
  });
}
