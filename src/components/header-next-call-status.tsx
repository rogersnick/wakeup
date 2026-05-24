"use client";

import { AlarmClockCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  formatScheduleSummary,
  getNextActiveWakeup,
  type WakeupDisplay,
} from "@/lib/wakeup/display";

type WakeupsResponse = {
  wakeups: WakeupDisplay[];
};

export function HeaderNextCallStatus() {
  const pathname = usePathname();
  const [wakeups, setWakeups] = useState<WakeupDisplay[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchWakeups() {
      const response = await fetch("/api/wakeups");
      if (!response.ok || cancelled) {
        return;
      }

      const data = (await response.json()) as WakeupsResponse;
      if (!cancelled) {
        setWakeups(data.wakeups ?? []);
      }
    }

    void fetchWakeups();
    const intervalId = window.setInterval(() => {
      void fetchWakeups();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pathname]);

  const nextWakeup = useMemo(() => getNextActiveWakeup(wakeups), [wakeups]);

  if (!nextWakeup) {
    return (
      <div className="flex items-center gap-2 border border-border-light bg-muted px-2.5 py-1.5">
        <AlarmClockCheck className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Not armed
        </span>
      </div>
    );
  }

  const summary = formatScheduleSummary(
    nextWakeup.type,
    nextWakeup.scheduledDate,
    nextWakeup.scheduledTimeLocal,
    nextWakeup.recurrence?.days ?? null,
  );

  return (
    <div className="flex items-center gap-2 border border-brand/60 bg-brand/12 px-2.5 py-1.5">
      <AlarmClockCheck className="h-4 w-4 text-brand" />
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-brand">
        Armed
      </span>
      <span className="hidden max-w-56 truncate text-sm text-foreground lg:inline">
        {summary}
      </span>
    </div>
  );
}
