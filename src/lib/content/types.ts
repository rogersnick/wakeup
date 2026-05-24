import type { GeneratedScriptMode } from "@/lib/wakeup/modes";

export type ContentBullet = {
  label: string;
  value: string;
};

export type ContentPayload = {
  mode: GeneratedScriptMode;
  headline: string;
  bullets: ContentBullet[];
  notes: string[];
  source: "api" | "llm" | "fallback";
};

export type ContentFetchContext = {
  mode: GeneratedScriptMode;
  timezone: string;
  city?: string | null;
  cityLabel?: string | null;
  favoriteTeam?: string | null;
  marketSymbols?: string[];
  zodiacSign?: string | null;
  firstName?: string | null;
  now?: Date;
};

export function createFallbackPayload(
  context: ContentFetchContext,
  message: string,
): ContentPayload {
  return {
    mode: context.mode,
    headline: getModeHeadline(context.mode),
    bullets: [{ label: "Update", value: message }],
    notes: [],
    source: "fallback",
  };
}

function getModeHeadline(mode: GeneratedScriptMode): string {
  switch (mode) {
    case "weather_report":
      return "Weather";
    case "local_news":
      return "Local news";
    case "sports_scores":
      return "Sports";
    case "market_brief":
      return "Markets";
    case "horoscope":
      return "Horoscope";
    case "daily_motivation":
      return "Motivation";
    case "history_today":
      return "On this day";
    case "word_of_day":
      return "Word of the day";
    case "fun_fact":
      return "Fun fact";
    default:
      return "Wake-up";
  }
}

export function payloadToPromptLines(payload: ContentPayload): string[] {
  const lines = [payload.headline];
  for (const bullet of payload.bullets) {
    lines.push(`${bullet.label}: ${bullet.value}`);
  }
  for (const note of payload.notes) {
    lines.push(note);
  }
  return lines;
}
