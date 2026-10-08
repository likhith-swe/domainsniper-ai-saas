import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WatchlistManager from "@/components/WatchlistManager";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Tripwire Manager",
  description: "Create, pause and delete drop-catching tripwire alerts.",
};

export default async function WatchlistsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="font-mono text-xs tracking-[0.3em] text-radar">// TRIPWIRE MANAGER</p>
      <h1 className="mt-2 text-3xl font-bold text-paper">
        Alert triggers, armed &amp; aimed
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-fog">
        Every armed tripwire is evaluated on the hourly cron sweep. Matching
        drops dispatch alerts across your selected channels with delivery
        latency tracked per event.
      </p>
      <div className="mt-8">
        <WatchlistManager email={user.email} />
      </div>
    </div>
  );
}
