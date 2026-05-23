"use client";

import { useMemo, useState } from "react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  disabled: boolean;
  onCreated: () => void;
};

export function ScheduleForm({ disabled, onCreated }: Props) {
  const [type, setType] = useState<"one_shot" | "recurring">("one_shot");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTimeLocal, setScheduledTimeLocal] = useState("07:00");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [scriptText, setScriptText] = useState(
    "Good morning. This is your wake up call. Time to get out of bed.",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort(),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/wakeups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          scheduledDate: type === "one_shot" ? scheduledDate : null,
          scheduledTimeLocal,
          recurrence: type === "recurring" ? { days } : null,
          scriptText,
          timezone,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to schedule wake-up");
      }

      setSuccess("Wake-up scheduled. Audio generated and stored.");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule wake-up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 text-stone-900">
      <h2 className="font-medium">Schedule a wake-up</h2>
      <p className="mt-1 text-sm text-stone-700">
        Nothing is scheduled until phone, audio, blob storage, and DB row all
        succeed.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={submit}>
        <div className="flex gap-2">
          {(["one_shot", "recurring"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`rounded-full px-4 py-2 text-sm ${
                type === option
                  ? "bg-stone-900 text-white"
                  : "border border-stone-300 text-stone-800"
              }`}
            >
              {option === "one_shot" ? "One-shot" : "Recurring"}
            </button>
          ))}
        </div>

        {type === "one_shot" ? (
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-stone-900">Date</span>
            <input
              type="date"
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900"
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
              required
            />
          </label>
        ) : (
          <div className="grid gap-2">
            <span className="text-sm font-medium text-stone-900">Days</span>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`rounded-full px-3 py-1 text-sm ${
                    days.includes(index)
                      ? "bg-amber-100 text-amber-900"
                      : "border border-stone-300 text-stone-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-stone-900">Time</span>
          <input
            type="time"
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900"
            value={scheduledTimeLocal}
            onChange={(event) => setScheduledTimeLocal(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="font-medium text-stone-900">Wake-up message</span>
          <textarea
            className="min-h-28 rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400"
            value={scriptText}
            maxLength={500}
            onChange={(event) => setScriptText(event.target.value)}
            required
          />
          <span className="text-stone-700">{scriptText.length}/500</span>
        </label>

        <p className="text-xs text-stone-700">Timezone: {timezone}</p>

        <button
          type="submit"
          disabled={disabled || loading}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Scheduling..." : "Schedule wake-up"}
        </button>
      </form>

      {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
