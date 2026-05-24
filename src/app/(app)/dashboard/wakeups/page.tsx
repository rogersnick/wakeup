"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { WakeUpStatsCard } from "@/components/wakeup-stats-card";
import { WakeupList } from "@/components/wakeup-list";
import { Button } from "@/components/ui/button";
import type { WakeUpStats } from "@/lib/wakeup/stats";

export default function WakeupsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<WakeUpStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const response = await fetch("/api/wakeups/stats");
        if (cancelled || !response.ok) {
          return;
        }

        const data = (await response.json()) as { stats: WakeUpStats };
        setStats(data.stats);
      } catch {
        if (!cancelled) {
          setStats(null);
        }
      }
    }

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <main className="bg-muted min-h-[calc(100vh-4rem)]">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
            Scheduled calls + attempt history
          </p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <h1 className="font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              All wake-ups
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="shrink-0 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            View scheduled calls, check their status, and cancel any you no
            longer need.
          </p>
        </div>

        <WakeupList refreshKey={refreshKey} />

        {stats ? <WakeUpStatsCard stats={stats} /> : null}
      </div>
    </main>
  );
}
