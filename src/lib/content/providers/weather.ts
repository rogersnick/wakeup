import { fetchWeatherForCity } from "@/lib/weather";
import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import { createFallbackPayload } from "@/lib/content/types";

export async function fetchWeatherContent(
  context: ContentFetchContext,
): Promise<ContentPayload> {
  const city = context.city?.trim();
  if (!city) {
    return createFallbackPayload(
      context,
      "Weather is unavailable — set your city in profile settings.",
    );
  }

  const weather = await fetchWeatherForCity(city);
  if (!weather) {
    return createFallbackPayload(
      context,
      `Weather is unavailable for ${context.cityLabel ?? city}.`,
    );
  }

  return {
    mode: "weather_report",
    headline: `Weather in ${weather.cityLabel}`,
    bullets: [
      {
        label: "Conditions",
        value: `${weather.tempC} degrees and ${weather.description}`,
      },
    ],
    notes: [],
    source: "api",
  };
}
