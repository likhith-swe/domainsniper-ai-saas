import { NextResponse, type NextRequest } from "next/server";
import { issueMagicToken } from "@/lib/auth/session";
import { ENV, NOTIFY } from "@/lib/env";
import { isValidEmail } from "@/lib/format";
import { sendEmailAlert } from "@/lib/notify";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/** Issues a 15-minute single-use magic link and emails it (or returns it in QA mode). */
export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const rl = rateLimit(`magic:${ip}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }

  const token = issueMagicToken(email);
  const link = `${ENV.appUrl}/api/auth/verify?token=${encodeURIComponent(token)}`;

  if (NOTIFY.emailConfigured) {
    await sendEmailAlert(
      email,
      "🔐 Your DomainSniper magic link (valid 15 minutes)",
      `<div style="font-family:monospace;background:#070b09;color:#e7f5ec;padding:24px">
        <p style="color:#2ee68d">DOMAINSNIPER.AI</p>
        <p>Click below to enter the sniper deck. This link is single-use and expires in 15 minutes.</p>
        <p><a href="${link}" style="color:#2ee68d">${link}</a></p>
      </div>`,
    );
    return NextResponse.json({ ok: true, delivery: "email" });
  }

  // QA / offline mode: surface the link directly for instant verification.
  return NextResponse.json({ ok: true, delivery: "dev", devLink: link });
}
