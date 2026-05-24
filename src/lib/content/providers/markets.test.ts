import { describe, expect, it } from "vitest";
import { formatMarketQuote } from "@/lib/content/providers/markets-yahoo";

describe("formatMarketQuote", () => {
  it("formats price and percent change", () => {
    expect(
      formatMarketQuote({
        symbol: "AAPL",
        shortName: "Apple Inc.",
        regularMarketPrice: 308.82,
        chartPreviousClose: 304.99,
      }),
    ).toBe("Apple Inc. at 308 dollars and 82 cents, up 1 point 3 percent");
  });

  it("handles negative moves", () => {
    expect(
      formatMarketQuote({
        symbol: "TSLA",
        shortName: "Tesla, Inc.",
        regularMarketPrice: 180,
        chartPreviousClose: 200,
      }),
    ).toBe("Tesla, Inc. at 180 dollars, down 10 percent");
  });
});
