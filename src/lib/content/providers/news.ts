import { fetchGoogleNewsContent } from "@/lib/content/providers/news-google";
import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import { createFallbackPayload } from "@/lib/content/types";

type NewsArticle = {
  title?: string;
  description?: string;
  source?: { name?: string };
};

type NewsApiResponse = {
  articles?: NewsArticle[];
  message?: string;
};

async function fetchNewsApiContent(
  context: ContentFetchContext,
  cityLabel: string,
  apiKey: string,
): Promise<ContentPayload | null> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", cityLabel);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "3");

  const response = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as NewsApiResponse;
  const articles = (data.articles ?? [])
    .filter((article) => article.title?.trim())
    .slice(0, 3);

  if (articles.length === 0) {
    return null;
  }

  return {
    mode: "local_news",
    headline: `Local news for ${cityLabel}`,
    bullets: articles.map((article, index) => ({
      label: `Headline ${index + 1}`,
      value: article.title!.trim(),
    })),
    notes: [],
    source: "api",
  };
}

export async function fetchLocalNewsContent(
  context: ContentFetchContext,
): Promise<ContentPayload> {
  const cityLabel = context.cityLabel ?? context.city?.trim();

  if (!cityLabel) {
    return createFallbackPayload(
      context,
      "Local news requires your city in profile settings.",
    );
  }

  try {
    const apiKey = process.env.NEWS_API_KEY?.trim();
    if (apiKey) {
      const newsApiPayload = await fetchNewsApiContent(context, cityLabel, apiKey);
      if (newsApiPayload) {
        return newsApiPayload;
      }
    }

    const googleNewsPayload = await fetchGoogleNewsContent(context);
    if (googleNewsPayload) {
      return googleNewsPayload;
    }

    return createFallbackPayload(
      context,
      `No recent headlines found for ${cityLabel}.`,
    );
  } catch {
    return createFallbackPayload(
      context,
      `Could not load local news for ${cityLabel}.`,
    );
  }
}
