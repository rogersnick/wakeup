import { fetchYahooMarketContent } from "@/lib/content/providers/markets-yahoo";
import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import { createFallbackPayload } from "@/lib/content/types";
import { formatSpokenDollars, formatSpokenPercent } from "@/lib/tts-format";

type FinnhubQuote = {
  c?: number;
  dp?: number;
};

async function fetchFinnhubMarketContent(
  symbols: string[],
  apiKey: string,
): Promise<ContentPayload | null> {
  const normalized = symbols
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 3);

  const quotes = await Promise.all(
    normalized.map(async (symbol) => {
      const url = new URL("https://finnhub.io/api/v1/quote");
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("token", apiKey);

      const response = await fetch(url, { next: { revalidate: 300 } });
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as FinnhubQuote;
      if (data.c === undefined || data.dp === undefined) {
        return null;
      }

      const direction = data.dp >= 0 ? "up" : "down";
      return {
        label: symbol,
        value: `${symbol} at ${formatSpokenDollars(data.c)}, ${direction} ${formatSpokenPercent(data.dp)}`,
      };
    }),
  );

  const bullets = quotes.filter(
    (quote): quote is { label: string; value: string } => quote !== null,
  );

  if (bullets.length === 0) {
    return null;
  }

  return {
    mode: "market_brief",
    headline: "Market brief",
    bullets,
    notes: [],
    source: "api",
  };
}

export async function fetchMarketContent(
  context: ContentFetchContext,
): Promise<ContentPayload> {
  const symbols = context.marketSymbols ?? [];
  if (symbols.length === 0) {
    return createFallbackPayload(
      context,
      "Add stock symbols to your profile for a market brief.",
    );
  }

  try {
    const apiKey = process.env.FINNHUB_API_KEY?.trim();
    if (apiKey) {
      const finnhubPayload = await fetchFinnhubMarketContent(symbols, apiKey);
      if (finnhubPayload) {
        return finnhubPayload;
      }
    }

    const yahooPayload = await fetchYahooMarketContent(symbols);
    if (yahooPayload) {
      return yahooPayload;
    }

    return createFallbackPayload(context, "Could not load market quotes.");
  } catch {
    return createFallbackPayload(context, "Could not load market quotes.");
  }
}
