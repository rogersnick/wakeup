"use client";

import { ChevronDown, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardEyebrow,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { formatWakeupMessage, type WakeupDisplay } from "@/lib/wakeup/display";

function ConfirmCancelModal({
  onConfirm,
  onDismiss,
}: {
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="mx-4 w-full max-w-sm border-2 border-foreground bg-background p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Confirm
        </p>
        <h2 className="mt-2 font-sans text-2xl font-extrabold tracking-tight text-foreground">
          Cancel this wake-up?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This call will be cancelled and won&apos;t ring. You can always
          schedule a new one.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="hover:bg-foreground hover:text-red-500"
            onClick={onConfirm}
          >
            Yes, cancel it
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onDismiss}
          >
            Keep it
          </Button>
        </div>
      </div>
    </div>
  );
}

const COLLAPSED_WAKEUP_COUNT = 3;

type WakeupAttemptSummary = {
  id: string;
  attemptNumber: number;
  status: string;
  gatherResult: string | null;
  startedAt: string;
  completedAt: string | null;
};

function formatAttemptHistory(attempts: WakeupAttemptSummary[]) {
  if (attempts.length === 0) {
    return null;
  }

  const callLabel = `${attempts.length} call${attempts.length === 1 ? "" : "s"}`;
  const confirmedAttempt = [...attempts]
    .reverse()
    .find((attempt) => attempt.gatherResult === "1");

  if (confirmedAttempt?.completedAt) {
    const confirmedAt = new Date(confirmedAttempt.completedAt).toLocaleTimeString(
      undefined,
      { hour: "numeric", minute: "2-digit" },
    );
    return `${callLabel} · confirmed at ${confirmedAt}`;
  }

  const lastAttempt = attempts[attempts.length - 1];
  if (lastAttempt.gatherResult === "2") {
    return `${callLabel} · last snoozed`;
  }

  if (lastAttempt.completedAt) {
    const lastAt = new Date(lastAttempt.completedAt).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${callLabel} · last call ${lastAt}`;
  }

  return callLabel;
}

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
  const [wakeups, setWakeups] = useState<WakeupDisplay[]>([]);
  const [attemptHistory, setAttemptHistory] = useState<
    Record<string, string | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWakeups() {
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }
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

        const historyEntries = await Promise.all(
          (data.wakeups as WakeupDisplay[]).map(async (wakeup) => {
            try {
              const attemptsResponse = await fetch(
                `/api/wakeups/${wakeup.id}/attempts`,
              );
              if (!attemptsResponse.ok) {
                return [wakeup.id, null] as const;
              }
              const attemptsData = (await attemptsResponse.json()) as {
                attempts: WakeupAttemptSummary[];
              };
              return [
                wakeup.id,
                formatAttemptHistory(attemptsData.attempts),
              ] as const;
            } catch {
              return [wakeup.id, null] as const;
            }
          }),
        );

        if (!cancelled) {
          setAttemptHistory(Object.fromEntries(historyEntries));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load wake-ups");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          hasLoadedOnce.current = true;
        }
      }
    }

    void fetchWakeups();

    return () => {
      cancelled = true;
    };
  }, [refreshCount, refreshKey]);

  async function cancelWakeUp(id: string) {
    if (cancellingId) {
      return;
    }

    setCancellingId(id);
    setError(null);

    const previousWakeups = wakeups;
    setWakeups((current) =>
      current.map((wakeup) =>
        wakeup.id === id ? { ...wakeup, status: "cancelled" } : wakeup,
      ),
    );

    try {
      const response = await fetch(`/api/wakeups/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to cancel wake-up");
      }
      setRefreshCount((value) => value + 1);
    } catch (err) {
      setWakeups(previousWakeups);
      setError(err instanceof Error ? err.message : "Failed to cancel wake-up");
    } finally {
      setCancellingId(null);
    }
  }

  const hasHiddenWakeups = wakeups.length > COLLAPSED_WAKEUP_COUNT;
  const visibleWakeups =
    expanded || !hasHiddenWakeups
      ? wakeups
      : wakeups.slice(0, COLLAPSED_WAKEUP_COUNT);
  const hiddenCount = wakeups.length - COLLAPSED_WAKEUP_COUNT;

  function renderWakeup(wakeup: WakeupDisplay) {
    const message = formatWakeupMessage(wakeup);

    return (
      <li key={wakeup.id}>
        <CardPanel className="transition-colors duration-100 hover:border-foreground">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardEyebrow>
              {wakeup.type === "one_shot" ? "One-shot" : "Recurring"}
            </CardEyebrow>
            <p className="mt-2 font-sans text-xl font-semibold tracking-tight text-foreground">
              {wakeup.scheduledTimeLocal}
            </p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {wakeup.scriptMode === "dynamic" ? (
                <>
                  <span className="font-semibold text-foreground">Weather report</span>
                  {wakeup.resolvedScriptText ? (
                    <>
                      {" "}
                      — Last message: &ldquo;{wakeup.resolvedScriptText}&rdquo;
                    </>
                  ) : (
                    <> — {message}</>
                  )}
                </>
              ) : (
                wakeup.scriptText
              )}
            </p>
          </div>
          <Badge variant={statusVariant(wakeup.status)}>{wakeup.status}</Badge>
        </div>

        <dl className="mt-4 grid gap-1 text-sm text-muted-foreground">
          <div>
            <dt className="inline font-semibold text-foreground/70">
              Next attempt:{" "}
            </dt>
            <dd className="inline">
              {new Date(wakeup.nextAttemptAt).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-foreground/70">
              Attempts:{" "}
            </dt>
            <dd className="inline">
              {wakeup.attemptCount}/{wakeup.maxAttempts}
            </dd>
          </div>
          {wakeup.snoozeCount > 0 ? (
            <div>
              <dt className="inline font-semibold text-foreground/70">
                Snoozes:{" "}
              </dt>
              <dd className="inline">{wakeup.snoozeCount}</dd>
            </div>
          ) : null}
          {attemptHistory[wakeup.id] ? (
            <div>
              <dt className="inline font-semibold text-foreground/70">
                Call history:{" "}
              </dt>
              <dd className="inline">{attemptHistory[wakeup.id]}</dd>
            </div>
          ) : null}
        </dl>

        {wakeup.status !== "cancelled" && wakeup.status !== "confirmed" ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={cancellingId !== null}
            onClick={() => setPendingCancelId(wakeup.id)}
            className="mt-4 hover:bg-foreground hover:text-red-500"
          >
            {cancellingId === wakeup.id ? "Cancelling..." : "Cancel"}
          </Button>
        ) : null}
        </CardPanel>
      </li>
    );
  }

  return (
    <Card className="p-8" variant="default">
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardEyebrow>Wake-ups</CardEyebrow>
          <CardTitle className="mt-2 text-2xl">Your wake-ups</CardTitle>
          <CardDescription>Scheduled calls and their current status.</CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
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
        {visibleWakeups.map(renderWakeup)}
      </ul>

      {pendingCancelId ? (
        <ConfirmCancelModal
          onConfirm={() => {
            void cancelWakeUp(pendingCancelId);
            setPendingCancelId(null);
          }}
          onDismiss={() => setPendingCancelId(null)}
        />
      ) : null}

      {!loading && hasHiddenWakeups ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronDown
            className={[
              "h-4 w-4 transition-transform duration-200",
              expanded ? "rotate-180" : "",
            ].join(" ")}
          />
          {expanded
            ? "Show fewer wake-ups"
            : `Show ${hiddenCount} more wake-up${hiddenCount === 1 ? "" : "s"}`}
        </Button>
      ) : null}
    </Card>
  );
}
