import { decodeHtmlEntities, parseRssItemTitles } from "@/lib/content/providers/news-google";
import type { ContentPayload } from "@/lib/content/types";
import { formatSpokenDollars, formatSpokenPercent } from "@/lib/tts-format";

type YahooChartMeta = {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  regularMarketPreviousClose?: number;
  marketState?: string;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: YahooChartMeta;
    }>;
  };
};

type YahooBatchQuote = {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  marketState?: string;
};

type YahooBatchQuoteResponse = {
  quoteResponse?: {
    result?: YahooBatchQuote[];
  };
};

type YahooSearchQuote = {
  symbol?: string;
  quoteType?: string;
};

type YahooSearchResponse = {
  quotes?: YahooSearchQuote[];
};

const YAHOO_HEADERS = {
  Accept: "application/json",
  "User-Agent": "WakeupApp/1.0 (https://github.com/wakeup)",
};

export function formatMarketQuote(meta: YahooChartMeta): string | null {
  const price = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose ?? meta.regularMarketPreviousClose;

  if (price === undefined && (previousClose === undefined || previousClose <= 0)) {
    return null;
  }

  const label = meta.shortName ?? meta.symbol ?? "Stock";
  if (price === undefined && previousClose !== undefined) {
    return `${label} closed at ${formatSpokenDollars(previousClose)}`;
  }
  if (price === undefined || previousClose === undefined || previousClose <= 0) {
    return null;
  }

  const changePct = ((price - previousClose) / previousClose) * 100;
  const direction = changePct >= 0 ? "up" : "down";

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

async function resolveYahooSymbol(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const upper = trimmed.toUpperCase();
  if (upper.length <= 5 && /^[A-Z][A-Z0-9.\-]{0,9}$/.test(upper)) {
    return upper;
  }

  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("quotesCount", "5");
  url.searchParams.set("newsCount", "0");

  const response = await fetch(url, {
    headers: YAHOO_HEADERS,
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as YahooSearchResponse;
  const symbol = data.quotes
    ?.find((quote) => {
      const candidate = quote.symbol?.trim();
      if (!candidate) {
        return false;
      }
      if (!quote.quoteType) {
        return true;
      }
      return ["EQUITY", "ETF", "MUTUALFUND", "INDEX"].includes(quote.quoteType);
    })
    ?.symbol?.trim();

  return symbol ? symbol.toUpperCase() : null;
}

async function fetchYahooBatchQuotes(
  symbols: string[],
): Promise<Array<{ label: string; value: string }>> {
  if (symbols.length === 0) {
    return [];
  }

  const url = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
  url.searchParams.set("symbols", symbols.join(","));

  const response = await fetch(url, {
    headers: YAHOO_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as YahooBatchQuoteResponse;
  const quotes = data.quoteResponse?.result ?? [];

  return quotes
    .map((quote) => {
      const symbol = quote.symbol?.toUpperCase();
      const price = quote.regularMarketPrice;
      const previousClose = quote.regularMarketPreviousClose;

      if (!symbol || (price === undefined && (previousClose === undefined || previousClose <= 0))) {
        return null;
      }

      const label = quote.shortName ?? symbol;
      if (price === undefined && previousClose !== undefined) {
        return {
          label: symbol,
          value: `${label} closed at ${formatSpokenDollars(previousClose)}`,
        };
      }
      if (price === undefined || previousClose === undefined || previousClose <= 0) {
        return null;
      }

      const changePct = ((price - previousClose) / previousClose) * 100;
      const direction = changePct >= 0 ? "up" : "down";

      return {
        label: symbol,
        value: `${label} at ${formatSpokenDollars(price)}, ${direction} ${formatSpokenPercent(changePct)}`,
      };
    })
    .filter((quote): quote is { label: string; value: string } => quote !== null);
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
  const rawInputs = symbols.map((symbol) => symbol.trim()).filter(Boolean).slice(0, 3);
  const normalized = Array.from(
    new Set(
      (
        await Promise.all(
          rawInputs.map(async (symbol) => {
            try {
              return await resolveYahooSymbol(symbol);
            } catch {
              return null;
            }
          }),
        )
      ).filter((symbol): symbol is string => symbol !== null),
    ),
  ).slice(0, 3);

  if (normalized.length === 0) {
    return null;
  }

  const batchQuotes = await fetchYahooBatchQuotes(normalized);
  const quotes =
    batchQuotes.length > 0
      ? batchQuotes.slice(0, 3)
      : (
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
