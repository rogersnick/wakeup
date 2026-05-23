"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Wakeup = {
  id: string;
  type: "one_shot" | "recurring";
  scheduledTimeLocal: string;
  scheduledDate: string | null;
  recurrence: { days: number[] } | null;
  scriptText: string;
  status: string;
  nextAttemptAt: string;
  attemptCount: number;
  maxAttempts: number;
};

function statusVariant(status: string): "default" | "primary" | "secondary" | "accent" | "success" | "warning" {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
    case "scheduled":
      return "primary";
    case "calling":
      return "accent";
    case "cancelled":
      return "default";
    default:
      return "warning";
  }
}

export function WakeupList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [wakeups, setWakeups] = useState<Wakeup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchWakeups() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/wakeups");
        const data = await response.json();
        if (cancelled) {
          return;
        }
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load wake-ups");
        }
        setWakeups(data.wakeups);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load wake-ups");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchWakeups();

    return () => {
      cancelled = true;
    };
  }, [refreshCount, refreshKey]);

  async function cancelWakeUp(id: string) {
    const response = await fetch(`/api/wakeups/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to cancel wake-up");
      return;
    }
    setRefreshCount((value) => value + 1);
  }

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardTitle>Your wake-ups</CardTitle>
          <CardDescription>Scheduled calls and their current status.</CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setRefreshCount((value) => value + 1)}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? <Alert className="mt-6">Loading...</Alert> : null}
      {error ? <Alert variant="error" className="mt-6">{error}</Alert> : null}

      {!loading && wakeups.length === 0 ? (
        <Alert className="mt-6">No wake-ups scheduled yet.</Alert>
      ) : null}

      <ul className="mt-6 grid gap-4">
        {wakeups.map((wakeup) => (
          <li
            key={wakeup.id}
            className="rounded-lg bg-muted p-5 transition-all duration-200 hover:scale-[1.01]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-foreground">
                  {wakeup.type === "one_shot" ? "One-shot" : "Recurring"} at{" "}
                  {wakeup.scheduledTimeLocal}
                </p>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {wakeup.scriptText}
                </p>
              </div>
              <Badge variant={statusVariant(wakeup.status)}>{wakeup.status}</Badge>
            </div>

            <dl className="mt-4 grid gap-1 text-sm text-gray-600">
              <div>
                <dt className="inline font-semibold text-gray-700">
                  Next attempt:{" "}
                </dt>
                <dd className="inline">
                  {new Date(wakeup.nextAttemptAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="inline font-semibold text-gray-700">
                  Attempts:{" "}
                </dt>
                <dd className="inline">
                  {wakeup.attemptCount}/{wakeup.maxAttempts}
                </dd>
              </div>
            </dl>

            {wakeup.status !== "cancelled" && wakeup.status !== "confirmed" ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void cancelWakeUp(wakeup.id)}
                className="mt-4"
              >
                Cancel
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
