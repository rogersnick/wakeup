"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { WakeupList } from "@/components/wakeup-list";
import { Button } from "@/components/ui/button";

export default function WakeupsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

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
      </div>
    </main>
  );
}
