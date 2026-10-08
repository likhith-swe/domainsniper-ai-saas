import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteWatchlist, toggleWatchlist } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** PATCH toggles active state. */
export async function PATCH(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "auth-required" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const updated = await toggleWatchlist(id, user.email);
  if (!updated) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, item: updated });
}

/** DELETE disarms permanently. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "auth-required" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const deleted = await deleteWatchlist(id, user.email);
  if (!deleted) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
