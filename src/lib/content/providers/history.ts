import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import { createFallbackPayload } from "@/lib/content/types";

type WikipediaOnThisDayEvent = {
  year?: number;
  text?: string;
};

type WikipediaOnThisDayResponse = {
  events?: WikipediaOnThisDayEvent[];
  births?: WikipediaOnThisDayEvent[];
};

const SKIP_EVENT_PATTERN =
  /\b(shooting|massacre|killed|dies|died|death|terror|bomb|bombing|war|flood|fire|injur|crash|assassin|murder|suicide|earthquake|disaster|slain|hostage|riot|protest turns violent)\b/i;

function getMonthDayParts(timezone: string, now: Date): { month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return { month, day };
}

function isWholesomeEvent(text: string): boolean {
  return !SKIP_EVENT_PATTERN.test(text);
}

function scoreEvent(event: WikipediaOnThisDayEvent, currentYear: number): number {
  const year = event.year ?? 0;
  const text = event.text ?? "";
  let score = 0;

  if (isWholesomeEvent(text)) {
    score += 100;
  } else {
    return -1000;
  }

  if (year > 0 && year <= currentYear - 10) {
    score += 40;
  }

  if (/\b(first|invent|discover|introduc|opens|debuts|founded|signed|adopted|published)\b/i.test(text)) {
    score += 25;
  }

  if (text.length >= 40 && text.length <= 220) {
    score += 10;
  }

  return score;
}

function pickHistoricalEvent(
  events: WikipediaOnThisDayEvent[],
  currentYear: number,
): WikipediaOnThisDayEvent | null {
  const ranked = [...events]
    .map((event) => ({ event, score: scoreEvent(event, currentYear) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.event ?? null;
}

function formatHistoricalEvent(event: WikipediaOnThisDayEvent): string {
  const year = event.year;
  let text = event.text?.trim().replace(/\s+/g, " ") ?? "";
  if (text.endsWith(".")) {
    text = text.slice(0, -1);
  }
  if (text.length > 0) {
    text = text.charAt(0).toLowerCase() + text.slice(1);
  }
  if (year && text) {
    return `On this day in ${year}, ${text}.`;
  }
  if (text) {
    return `On this day, ${text}.`;
  }
  return "";
}

export { formatHistoricalEvent };

export async function fetchHistoryTodayContent(
  context: ContentFetchContext,
): Promise<ContentPayload> {
  const timezone = context.timezone || "America/Toronto";
  const now = context.now ?? new Date();
  const { month, day } = getMonthDayParts(timezone, now);
  const currentYear = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
    }).format(now),
  );

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "WakeupApp/1.0 (https://github.com/wakeup)",
        },
        next: { revalidate: 86400 },
      },
    );

    if (!response.ok) {
      return createFallbackPayload(
        context,
        "Could not load today's historical events.",
      );
    }

    const data = (await response.json()) as WikipediaOnThisDayResponse;
    const selected =
      pickHistoricalEvent(data.events ?? [], currentYear) ??
      pickHistoricalEvent(data.births ?? [], currentYear);

    if (!selected?.text) {
      return createFallbackPayload(
        context,
        "No historical events were available for today.",
      );
    }

    const detail = formatHistoricalEvent(selected);
    const dateLabel = now.toLocaleDateString("en-US", {
      timeZone: timezone,
      month: "long",
      day: "numeric",
    });

    return {
      mode: "history_today",
      headline: `On this day, ${dateLabel}`,
      bullets: [{ label: "History", value: detail }],
      notes: [],
      source: "api",
    };
  } catch {
    return createFallbackPayload(
      context,
      "Could not load today's historical events.",
    );
  }
}
