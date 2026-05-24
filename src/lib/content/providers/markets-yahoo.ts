import { decodeHtmlEntities, parseRssItemTitles } from "@/lib/content/providers/news-google";
import type { ContentPayload } from "@/lib/content/types";
import { formatSpokenDollars, formatSpokenPercent } from "@/lib/tts-format";

type YahooChartMeta = {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: YahooChartMeta;
    }>;
  };
};

const YAHOO_HEADERS = {
  Accept: "application/json",
  "User-Agent": "WakeupApp/1.0 (https://github.com/wakeup)",
};

export function formatMarketQuote(meta: YahooChartMeta): string | null {
  const price = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose;

  if (price === undefined || previousClose === undefined || previousClose <= 0) {
    return null;
  }

  const changePct = ((price - previousClose) / previousClose) * 100;
  const direction = changePct >= 0 ? "up" : "down";
  const label = meta.shortName ?? meta.symbol ?? "Stock";

  return `${label} at ${formatSpokenDollars(price)}, ${direction} ${formatSpokenPercent(changePct)}`;
}

export async function fetchYahooQuote(
  symbol: string,
): Promise<{ label: string; value: string } | null> {
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", "1d");

  const response = await fetch(url, {
    headers: YAHOO_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as YahooChartResponse;
  const meta = data.chart?.result?.[0]?.meta;
  if (!meta) {
    return null;
  }

  const formatted = formatMarketQuote(meta);
  if (!formatted) {
    return null;
  }

  return {
    label: meta.symbol ?? symbol.toUpperCase(),
    value: formatted,
  };
}

export async function fetchYahooSymbolNews(symbol: string): Promise<string | null> {
  const url = new URL("https://feeds.finance.yahoo.com/rss/2.0/headline");
  url.searchParams.set("s", symbol.toUpperCase());
  url.searchParams.set("region", "US");
  url.searchParams.set("lang", "en-US");

  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": YAHOO_HEADERS["User-Agent"],
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const xml = await response.text();
  const headline = parseRssItemTitles(xml, 1)[0];
  return headline ? decodeHtmlEntities(headline) : null;
}

export async function fetchYahooMarketContent(
  symbols: string[],
): Promise<ContentPayload | null> {
  const normalized = symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);

  if (normalized.length === 0) {
    return null;
  }

  const quotes = (
    await Promise.all(normalized.map((symbol) => fetchYahooQuote(symbol)))
  ).filter((quote): quote is { label: string; value: string } => quote !== null);

  if (quotes.length === 0) {
    return null;
  }

  const headline = await fetchYahooSymbolNews(normalized[0]!);

  return {
    mode: "market_brief",
    headline: "Market brief",
    bullets: quotes,
    notes: headline ? [`Headline: ${headline}`] : [],
    source: "api",
  };
}
