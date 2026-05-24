import { format, parseISO } from "date-fns";
import { formatTimeLabel } from "@/components/ui/time-picker";
import {
  formatModeSummary,
  normalizeScriptMode,
  type UserProfileContext,
  type WakeupContentConfig,
  type WakeupScriptMode,
  type WakeupScriptModeInput,
} from "@/lib/wakeup/modes";
import {
  normalizeChallengeType,
  type ChallengeType,
} from "@/lib/wakeup/challenge";

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
  scriptMode: WakeupScriptModeInput;
  contentConfig?: WakeupContentConfig | null;
  resolvedScriptText: string | null;
  status: string;
  nextAttemptAt: string;
  attemptCount: number;
  maxAttempts: number;
  snoozeCount: number;
  challengeEnabled?: boolean;
  challengeType?: string | null;
};

export type WakeupCallControl = {
  id: string;
  digit: string | null;
  label: string;
  primary?: boolean;
};

const CHALLENGE_CONFIRM_LABELS: Record<ChallengeType, string> = {
  quick_math: "Answer math",
  pattern_continue: "Complete pattern",
  memory_echo: "Middle digit",
};

export function getWakeupCallControls(wakeup: {
  challengeEnabled?: boolean;
  challengeType?: string | null;
}): WakeupCallControl[] {
  if (wakeup.challengeEnabled) {
    const challengeType = normalizeChallengeType(wakeup.challengeType);
    return [
      {
        id: "challenge",
        digit: null,
        label: CHALLENGE_CONFIRM_LABELS[challengeType],
        primary: true,
      },
      {
        id: "snooze",
        digit: "9",
        label: "Snooze",
      },
    ];
  }

  return [
    {
      id: "confirm",
      digit: "1",
      label: "I'm awake",
      primary: true,
    },
    {
      id: "snooze",
      digit: "9",
      label: "Snooze",
    },
  ];
}

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
  profile: UserProfileContext = {},
) {
  const mode = normalizeScriptMode(wakeup.scriptMode);

  if (mode !== "static") {
    if (wakeup.resolvedScriptText) {
      return wakeup.resolvedScriptText;
    }

    return formatModeSummary(mode, profile, wakeup.contentConfig);
  }

  return wakeup.scriptText;
}

export function getWakeupModeLabel(wakeup: WakeupDisplay): string {
  return formatModeSummary(
    normalizeScriptMode(wakeup.scriptMode),
    {},
    wakeup.contentConfig,
  ).split(" — ")[0] ?? "Custom message";
}

export type { WakeupScriptMode };
