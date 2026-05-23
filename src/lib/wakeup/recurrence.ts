import { addMinutes, format } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type RecurrenceRule = { days: number[] };

export function parseLocalTime(timeLocal: string): {
  hours: number;
  minutes: number;
} {
  const [hours, minutes] = timeLocal.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Invalid time format. Use HH:mm.");
  }
  return { hours, minutes };
}

function zonedDateTime(
  dateStr: string,
  timeLocal: string,
  timezone: string,
): Date {
  parseLocalTime(timeLocal);
  return fromZonedTime(`${dateStr}T${timeLocal}:00`, timezone);
}

function dayOfWeekInTimezone(date: Date, timezone: string): number {
  return toZonedTime(date, timezone).getDay();
}

export function computeFirstAttemptAt(input: {
  type: "one_shot" | "recurring";
  scheduledTimeLocal: string;
  scheduledDate?: string | null;
  recurrence?: RecurrenceRule | null;
  timezone: string;
  now?: Date;
}): Date {
  const now = input.now ?? new Date();

  if (input.type === "one_shot") {
    if (!input.scheduledDate) {
      throw new Error("One-shot wake-ups require a date.");
    }
    const target = zonedDateTime(
      input.scheduledDate,
      input.scheduledTimeLocal,
      input.timezone,
    );
    if (target <= now) {
      throw new Error("Wake-up time must be in the future.");
    }
    return target;
  }

  const days = input.recurrence?.days ?? [];
  if (days.length === 0) {
    throw new Error("Recurring wake-ups require at least one day.");
  }

  const zonedNow = toZonedTime(now, input.timezone);
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(zonedNow);
    candidate.setDate(candidate.getDate() + offset);
    const dateStr = format(candidate, "yyyy-MM-dd");
    const dow = dayOfWeekInTimezone(candidate, input.timezone);
    if (!days.includes(dow)) {
      continue;
    }

    const attemptAt = zonedDateTime(
      dateStr,
      input.scheduledTimeLocal,
      input.timezone,
    );
    if (attemptAt > now) {
      return attemptAt;
    }
  }

  throw new Error("Could not find the next recurring wake-up time.");
}

export function computeNextOccurrence(input: {
  scheduledTimeLocal: string;
  recurrence: RecurrenceRule;
  timezone: string;
  after: Date;
}): Date {
  const zonedAfter = toZonedTime(input.after, input.timezone);
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(zonedAfter);
    candidate.setDate(candidate.getDate() + offset);
    const dateStr = format(candidate, "yyyy-MM-dd");
    const dow = dayOfWeekInTimezone(candidate, input.timezone);
    if (!input.recurrence.days.includes(dow)) {
      continue;
    }
    return zonedDateTime(dateStr, input.scheduledTimeLocal, input.timezone);
  }

  throw new Error("Could not compute the next recurring occurrence.");
}

export function computeRetryAttemptAt(
  now: Date,
  retryIntervalMinutes: number,
): Date {
  return addMinutes(now, retryIntervalMinutes);
}

export function formatNextAttemptForDisplay(
  nextAttemptAt: Date,
  timezone: string,
): string {
  const zoned = toZonedTime(nextAttemptAt, timezone);
  return `${format(zoned, "yyyy-MM-dd")} ${format(zoned, "HH:mm")}`;
}
