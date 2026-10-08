import { NextResponse, type NextRequest } from "next/server";
import { isValidEmail } from "@/lib/format";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";
import { subscribeNewsletter } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`newsletter:${ip}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate-limited" },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }

  const source =
    typeof body.source === "string" ? body.source.slice(0, 40) : "footer";
  const result = await subscribeNewsletter(email, source);
  return NextResponse.json({
    ok: true,
    created: result.created,
    message: result.created
      ? "Subscribed — first digest lands tomorrow 06:00 IST."
      : "You're already on the list.",
  });
}
