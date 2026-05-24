import { fetchHistoryTodayContent } from "@/lib/content/providers/history";
import { fetchLlmContent } from "@/lib/content/providers/llm";
import { fetchLocalNewsContent } from "@/lib/content/providers/news";
import { fetchMarketContent } from "@/lib/content/providers/markets";
import { fetchSportsContent } from "@/lib/content/providers/sports";
import { fetchWeatherContent } from "@/lib/content/providers/weather";
import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import type { GeneratedScriptMode } from "@/lib/wakeup/modes";

export async function fetchContentForMode(
  context: ContentFetchContext,
): Promise<ContentPayload> {
  let payload: ContentPayload;

  switch (context.mode) {
    case "weather_report":
      payload = await fetchWeatherContent(context);
      break;
    case "local_news":
      payload = await fetchLocalNewsContent(context);
      break;
    case "sports_scores":
      payload = await fetchSportsContent(context);
      break;
    case "market_brief":
      payload = await fetchMarketContent(context);
      break;
    case "history_today":
      payload = await fetchHistoryTodayContent(context);
      break;
    case "daily_motivation":
    case "word_of_day":
    case "fun_fact":
      payload = await fetchLlmContent(context);
      break;
    default:
      payload = await fetchWeatherContent(context);
  }

  if (payload.source === "fallback") {
    console.warn(
      `[content] fallback used for ${context.mode}`,
      payload.bullets[0]?.value,
    );
  }

  return payload;
}

export function buildContentContext(input: {
  mode: GeneratedScriptMode;
  timezone: string;
  city?: string | null;
  cityLabel?: string | null;
  favoriteTeam?: string | null;
  marketSymbols?: string[];
  zodiacSign?: string | null;
  firstName?: string | null;
}): ContentFetchContext {
  return {
    mode: input.mode,
    timezone: input.timezone,
    city: input.city,
    cityLabel: input.cityLabel,
    favoriteTeam: input.favoriteTeam,
    marketSymbols: input.marketSymbols,
    zodiacSign: input.zodiacSign,
    firstName: input.firstName,
    now: new Date(),
  };
}
