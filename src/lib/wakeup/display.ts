import { format, parseISO } from "date-fns";
import { formatTimeLabel } from "@/components/ui/time-picker";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatScheduleSummary(
  type: "one_shot" | "recurring",
  scheduledDate: string | null,
  scheduledTimeLocal: string,
  days: number[] | null,
) {
  const time = formatTimeLabel(scheduledTimeLocal);

  if (type === "one_shot") {
    const dateLabel = scheduledDate
      ? format(parseISO(scheduledDate), "EEEE, MMM d")
      : "Pick a date";
    return `${dateLabel} at ${time}`;
  }

  const recurrenceDays = days ?? [];

  if (recurrenceDays.length === 7) {
    return `Every day at ${time}`;
  }

  if (
    recurrenceDays.length === 5 &&
    [1, 2, 3, 4, 5].every((day) => recurrenceDays.includes(day))
  ) {
    return `Weekdays at ${time}`;
  }

  if (
    recurrenceDays.length === 2 &&
    recurrenceDays.includes(0) &&
    recurrenceDays.includes(6)
  ) {
    return `Weekends at ${time}`;
  }

  const dayNames = recurrenceDays.map((day) => DAY_NAMES[day]).join(", ");
  return `${dayNames} at ${time}`;
}

export type WakeupDisplay = {
  id: string;
  type: "one_shot" | "recurring";
  scheduledTimeLocal: string;
  scheduledDate: string | null;
  recurrence: { days: number[] } | null;
  scriptText: string;
  scriptMode: "static" | "dynamic";
  resolvedScriptText: string | null;
  status: string;
  nextAttemptAt: string;
  attemptCount: number;
  maxAttempts: number;
  snoozeCount: number;
};

export function isActiveWakeup(wakeup: WakeupDisplay) {
  return wakeup.status === "scheduled" || wakeup.status === "calling";
}

export function getNextActiveWakeup(wakeups: WakeupDisplay[]) {
  return wakeups
    .filter(isActiveWakeup)
    .sort(
      (a, b) =>
        new Date(a.nextAttemptAt).getTime() -
        new Date(b.nextAttemptAt).getTime(),
    )[0];
}

export function formatWakeupMessage(
  wakeup: WakeupDisplay,
  userCity?: string | null,
) {
  if (wakeup.scriptMode === "dynamic") {
    if (wakeup.resolvedScriptText) {
      return wakeup.resolvedScriptText;
    }
    const city = userCity?.trim();
    return city
      ? `Weather report for ${city}.`
      : "Weather report — set your city to include local conditions.";
  }

  return wakeup.scriptText;
}
