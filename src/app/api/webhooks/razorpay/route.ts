import { NextResponse, type NextRequest } from "next/server";
import {
  PRO_PRICE_INR_MINOR,
  verifyRazorpayWebhookSignature,
} from "@/lib/billing";
import { ENV } from "@/lib/env";
import { upsertSubscription } from "@/lib/queries";

export const dynamic = "force-dynamic";

type AnyDict = Record<string, any>;

function dig(obj: unknown, path: string[]): AnyDict | string | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as AnyDict)[key];
    if (cur === undefined) return undefined;
  }
  return (cur as AnyDict | string) ?? undefined;
}

/** Hosted payment-link callback redirect (GET). */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(`${origin}/dashboard?upgraded=razorpay`, 302);
}

/** Razorpay webhook receiver with HMAC-SHA256 signature verification. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const verified = verifyRazorpayWebhookSignature(raw, signature);

  if (ENV.razorpayWebhookSecret && !verified) {
    return NextResponse.json({ error: "invalid-signature" }, { status: 400 });
  }

  let body: AnyDict;
  try {
    body = JSON.parse(raw) as AnyDict;
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const event = String(body.event ?? "");
  const isPaid =
    event === "payment_link.paid" ||
    event === "payment.captured" ||
    event === "subscription.charged";
  const isCanceled =
    event === "payment_link.canceled" || event === "subscription.cancelled";

  if (isPaid || isCanceled) {
    const email =
      (dig(body, ["payload", "payment_link", "entity", "notes", "userEmail"]) as
        | string
        | undefined) ??
      (dig(body, ["payload", "payment", "entity", "notes", "userEmail"]) as
        | string
        | undefined) ??
      (dig(body, ["payload", "payment", "entity", "email"]) as string | undefined) ??
      (dig(body, ["payload", "customer", "entity", "email"]) as string | undefined);

    if (email) {
      const amount = Number(
        dig(body, ["payload", "payment", "entity", "amount"]) ?? PRO_PRICE_INR_MINOR,
      );
      await upsertSubscription({
        userEmail: String(email),
        provider: "razorpay",
        providerSubId:
          (dig(body, ["payload", "payment", "entity", "id"]) as string | undefined) ??
          null,
        plan: isPaid ? "pro" : "free",
        status: isPaid ? "active" : "canceled",
        amountMinor: Number.isFinite(amount) ? amount : PRO_PRICE_INR_MINOR,
        currency: "INR",
        currentPeriodEnd: new Date(
          Date.now() + 30 * 86_400_000,
        ).toISOString(),
      });
    }
  }

  return NextResponse.json({
    received: true,
    verified,
    simulated: !ENV.razorpayWebhookSecret,
    event,
  });
}
