import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "./env";

export const PRO_PRICE_INR_MINOR = 49_900; // ₹499/mo
export const PRO_PRICE_USD_MINOR = 900; // $9/mo

function safeEqualHex(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(actual, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Razorpay hosted payment link (India, ₹499/mo). */
export async function createRazorpayPaymentLink(
  email: string,
  appUrl: string,
): Promise<{ id: string; url: string }> {
  const mod = await import("razorpay");
  const Razorpay = mod.default;
  const rzp = new Razorpay({
    key_id: ENV.razorpayKeyId,
    key_secret: ENV.razorpayKeySecret,
  });
  const link = await rzp.paymentLink.create({
    amount: PRO_PRICE_INR_MINOR,
    currency: "INR",
    description: "DomainSniper Club Pro — Monthly",
    customer: { email, name: email.split("@")[0] },
    notify: { email: true },
    callback_url: `${appUrl}/dashboard?upgraded=razorpay`,
    callback_method: "get",
    notes: { plan: "pro", userEmail: email },
  });
  return { id: link.id, url: link.short_url };
}

/** Stripe Checkout subscription session (Global, $9/mo). */
export async function createStripeCheckoutSession(
  email: string,
  appUrl: string,
): Promise<string> {
  const mod = await import("stripe");
  const Stripe = mod.default;
  const stripe = new Stripe(ENV.stripeSecret);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    success_url: `${appUrl}/dashboard?upgraded=stripe`,
    cancel_url: `${appUrl}/?checkout=canceled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PRO_PRICE_USD_MINOR,
          recurring: { interval: "month" },
          product_data: {
            name: "DomainSniper Club Pro",
            description: "Sub-second tripwire alerts, full backlink vault, valuation API.",
          },
        },
      },
    ],
    metadata: { plan: "pro", userEmail: email },
  });
  return session.url ?? "";
}

/** Razorpay webhook signature (HMAC-SHA256 of raw body). */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  if (!ENV.razorpayWebhookSecret || !signature) return false;
  const expected = createHmac("sha256", ENV.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Razorpay checkout JS response signature (order_id|payment_id). */
export function verifyRazorpayCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!ENV.razorpayKeySecret || !signature) return false;
  const expected = createHmac("sha256", ENV.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

export interface StripeWebhookResult {
  ok: boolean;
  type: string | null;
  object: Record<string, unknown> | null;
}

/** Stripe webhook verification via the official SDK. */
export async function verifyStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<StripeWebhookResult> {
  if (!ENV.stripeWebhookSecret || !signature) return { ok: false, type: null, object: null };
  try {
    const mod = await import("stripe");
    const Stripe = mod.default;
    const stripe = new Stripe(ENV.stripeSecret);
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      ENV.stripeWebhookSecret,
    );
    return {
      ok: true,
      type: event.type,
      object: event.data.object as unknown as Record<string, unknown>,
    };
  } catch {
    return { ok: false, type: null, object: null };
  }
}
