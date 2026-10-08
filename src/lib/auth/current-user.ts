import { readSessionCookie } from "./session";
import { getSubscription } from "../queries";
import type { SessionUser } from "../types";

/**
 * Resolves the authenticated user for the current request and reconciles the
 * session with the live subscription state (Razorpay / Stripe / sandbox).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await readSessionCookie();
  if (!session) return null;
  try {
    const sub = await getSubscription(session.email);
    if (sub && sub.status === "active" && sub.plan === "pro") {
      return { ...session, plan: "pro", vip: true };
    }
  } catch {
    // offline-safe: keep the cookie-derived state
  }
  return session;
}
