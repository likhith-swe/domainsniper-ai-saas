import { NextResponse } from "next/server";
import { getHealthSnapshot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getHealthSnapshot();
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json(
      { ok: false, db: "memory", catalogCount: 0, version: "2.1.0" },
      { status: 200 },
    );
  }
}
