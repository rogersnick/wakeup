import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";

export function buildNewsSearchQuery(cityLabel: string): string {
  const parts = cityLabel
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`;
  }

  return parts[0] ?? cityLabel.trim();
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function cleanGoogleNewsTitle(title: string): string {
  const decoded = decodeHtmlEntities(title.trim());
  const withoutSource = decoded.replace(/\s*-\s*[^-]+$/, "").trim();
  return withoutSource.endsWith(".") ? withoutSource.slice(0, -1) : withoutSource;
}

export function parseRssItemTitles(xml: string, limit: number): string[] {
  const titles: string[] = [];
  const itemPattern =
    /<item>[\s\S]*?<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]+))<\/title>[\s\S]*?<\/item>/gi;

  let match = itemPattern.exec(xml);
  while (match && titles.length < limit) {
    const raw = (match[1] ?? match[2] ?? "").trim();
    const cleaned = cleanGoogleNewsTitle(raw);
    if (cleaned) {
      titles.push(cleaned);
    }
    match = itemPattern.exec(xml);
  }

  return titles;
}

export async function fetchGoogleNewsContent(
  context: ContentFetchContext,
): Promise<ContentPayload | null> {
  const cityLabel = context.cityLabel ?? context.city?.trim();
  if (!cityLabel) {
    return null;
  }

  const query = `${buildNewsSearchQuery(cityLabel)} when:2d`;
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en-CA");
  url.searchParams.set("gl", "CA");
  url.searchParams.set("ceid", "CA:en");

  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "WakeupApp/1.0 (https://github.com/wakeup)",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const xml = await response.text();
  const headlines = parseRssItemTitles(xml, 3);
  if (headlines.length === 0) {
    return null;
  }

  return {
    mode: "local_news",
    headline: `Local news for ${cityLabel}`,
    bullets: headlines.map((headline, index) => ({
      label: `Headline ${index + 1}`,
      value: headline,
    })),
    notes: [],
    source: "api",
  };
}
