import { describe, expect, it } from "vitest";
import {
  formatModeSummary,
  getMissingPrerequisites,
  getModePrerequisites,
  isGeneratedMode,
  normalizeScriptMode,
  parseMarketSymbols,
} from "@/lib/wakeup/modes";
import { sanitizeContentConfig } from "@/lib/wakeup/validate-message";

describe("wakeup modes", () => {
  it("normalizes legacy dynamic mode", () => {
    expect(normalizeScriptMode("dynamic")).toBe("weather_report");
  });

  it("detects generated modes", () => {
    expect(isGeneratedMode("static")).toBe(false);
    expect(isGeneratedMode("fun_fact")).toBe(true);
    expect(isGeneratedMode("dynamic")).toBe(true);
  });

  it("returns prerequisites by mode", () => {
    expect(getModePrerequisites("local_news")).toEqual(["city"]);
    expect(getModePrerequisites("sports_scores")).toEqual(["favoriteTeam"]);
    expect(getModePrerequisites("daily_motivation")).toEqual([]);
  });

  it("detects missing profile prerequisites", () => {
    const missing = getMissingPrerequisites("market_brief", {
      marketSymbols: "",
    });
    expect(missing).toContain("marketSymbols");
  });

  it("formats mode summaries", () => {
    expect(
      formatModeSummary("weather_report", {
        cityResolvedLabel: "Calgary, Alberta, Canada",
      }),
    ).toContain("Calgary");
  });

  it("parses market symbols", () => {
    expect(parseMarketSymbols("aapl, tsla")).toEqual(["AAPL", "TSLA"]);
  });
});

describe("content config sanitization", () => {
  it("stores market symbols for market brief", () => {
    const config = sanitizeContentConfig(
      "market_brief",
      { marketSymbols: "AAPL, TSLA" },
      null,
    );
    expect(config).toEqual({ marketSymbols: ["AAPL", "TSLA"] });
  });

  it("returns null for static mode", () => {
    expect(sanitizeContentConfig("static", {}, null)).toBeNull();
  });
});
