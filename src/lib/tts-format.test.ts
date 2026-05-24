import { describe, expect, it } from "vitest";
import {
  formatSpokenDollars,
  formatSpokenPercent,
  normalizeScriptForSpeech,
} from "@/lib/tts-format";

describe("formatSpokenDollars", () => {
  it("writes whole dollars and cents", () => {
    expect(formatSpokenDollars(308.82)).toBe("308 dollars and 82 cents");
  });

  it("omits cents when zero", () => {
    expect(formatSpokenDollars(180)).toBe("180 dollars");
  });

  it("handles one dollar and one cent", () => {
    expect(formatSpokenDollars(1.01)).toBe("1 dollar and 1 cent");
  });
});

describe("formatSpokenPercent", () => {
  it("writes decimal percents as points", () => {
    expect(formatSpokenPercent(1.3)).toBe("1 point 3 percent");
  });

  it("writes whole percents plainly", () => {
    expect(formatSpokenPercent(10)).toBe("10 percent");
  });
});

describe("normalizeScriptForSpeech", () => {
  it("replaces dollar signs and decimal percents in scripts", () => {
    expect(
      normalizeScriptForSpeech(
        "Apple Inc. at $308.82, up 1.3 percent. Time to get up.",
      ),
    ).toBe(
      "Apple Inc. at 308 dollars and 82 cents, up 1 point 3 percent. Time to get up.",
    );
  });
});
