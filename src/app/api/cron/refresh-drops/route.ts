import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";
import { runCronRefresh } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(req: Request) {
  if (ENV.cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${ENV.cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const result = await runCronRefresh();
  return NextResponse.json(result);
}

/** Advances drop countdowns and dispatches matching tripwire alerts. */
export async function POST(req: Request) {
  return handle(req);
}

export async function GET(req: Request) {
  return handle(req);
}
