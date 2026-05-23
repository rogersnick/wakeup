"use client";

import { useCallback, useEffect, useState } from "react";

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

export function WakeupList() {
  const [wakeups, setWakeups] = useState<Wakeup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWakeups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/wakeups");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load wake-ups");
      }
      setWakeups(data.wakeups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wake-ups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWakeups();
  }, [loadWakeups]);

  async function cancelWakeUp(id: string) {
    const response = await fetch(`/api/wakeups/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Failed to cancel wake-up");
      return;
    }
    await loadWakeups();
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium text-stone-900">Your wake-ups</h2>
        <button
          type="button"
          onClick={() => void loadWakeups()}
          className="text-sm text-stone-600 hover:text-stone-900"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-stone-500">Loading...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && wakeups.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">No wake-ups scheduled yet.</p>
      ) : null}

      <ul className="mt-4 grid gap-3">
        {wakeups.map((wakeup) => (
          <li
            key={wakeup.id}
            className="rounded-xl border border-stone-200 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-900">
                  {wakeup.type === "one_shot" ? "One-shot" : "Recurring"} at{" "}
                  {wakeup.scheduledTimeLocal}
                </p>
                <p className="mt-1 text-sm text-stone-600 line-clamp-2">
                  {wakeup.scriptText}
                </p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-stone-700">
                {wakeup.status}
              </span>
            </div>

            <dl className="mt-3 grid gap-1 text-sm text-stone-600">
              <div>
                <dt className="inline font-medium text-stone-700">
                  Next attempt:{" "}
                </dt>
                <dd className="inline">
                  {new Date(wakeup.nextAttemptAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-stone-700">
                  Attempts:{" "}
                </dt>
                <dd className="inline">
                  {wakeup.attemptCount}/{wakeup.maxAttempts}
                </dd>
              </div>
            </dl>

            {wakeup.status !== "cancelled" && wakeup.status !== "confirmed" ? (
              <button
                type="button"
                onClick={() => void cancelWakeUp(wakeup.id)}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Cancel
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
