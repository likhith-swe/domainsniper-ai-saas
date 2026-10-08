import { NextResponse, type NextRequest } from "next/server";
import { PRO_PRICE_USD_MINOR, verifyStripeWebhook } from "@/lib/billing";
import { ENV } from "@/lib/env";
import { upsertSubscription } from "@/lib/queries";

export const dynamic = "force-dynamic";

type StripeObj = {
  customer_email?: string;
  subscription?: string;
  status?: string;
  metadata?: Record<string, string>;
  current_period_end?: number;
};

/** Stripe webhook receiver with official-SDK signature verification. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let type = "";
  let obj: StripeObj | null = null;
  let verified = false;

  if (ENV.stripeWebhookSecret) {
    const result = await verifyStripeWebhook(raw, signature);
    if (!result.ok) {
      return NextResponse.json({ error: "invalid-signature" }, { status: 400 });
    }
    verified = true;
    type = result.type ?? "";
    obj = (result.object as unknown as StripeObj) ?? null;
  } else {
    // Dev sandbox: accept raw JSON so QA flows work without signing secrets.
    try {
      const parsed = JSON.parse(raw) as { type?: string; data?: { object?: unknown } };
      type = parsed.type ?? "";
      obj = (parsed.data?.object as StripeObj) ?? null;
    } catch {
      return NextResponse.json({ error: "invalid-json" }, { status: 400 });
    }
  }

  const email = obj?.customer_email ?? obj?.metadata?.userEmail;

  if (type === "checkout.session.completed" && email && obj) {
    await upsertSubscription({
      userEmail: email,
      provider: "stripe",
      providerSubId:
        typeof obj.subscription === "string" ? obj.subscription : null,
      plan: "pro",
      status: "active",
      amountMinor: PRO_PRICE_USD_MINOR,
      currency: "USD",
      currentPeriodEnd: obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : new Date(Date.now() + 30 * 86_400_000).toISOString(),
    });
  }

  if (
    (type === "customer.subscription.updated" ||
      type === "customer.subscription.created" ||
      type === "customer.subscription.deleted") &&
    email &&
    obj
  ) {
    const status =
      type === "customer.subscription.deleted"
        ? "canceled"
        : obj.status === "past_due"
          ? "past_due"
          : obj.status === "active" || obj.status === "trialing"
            ? "active"
            : "canceled";
    await upsertSubscription({
      userEmail: email,
      provider: "stripe",
      providerSubId:
        typeof obj.subscription === "string" ? obj.subscription : null,
      plan: status === "active" ? "pro" : "free",
      status,
      amountMinor: PRO_PRICE_USD_MINOR,
      currency: "USD",
      currentPeriodEnd: obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null,
    });
  }

  return NextResponse.json({ received: true, verified, simulated: !ENV.stripeWebhookSecret, type });
}
