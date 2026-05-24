import { describe, expect, it } from "vitest";
import { formatHistoricalEvent } from "@/lib/content/providers/history";

const SKIP_EVENT_PATTERN =
  /\b(shooting|massacre|killed|dies|died|death|terror|bomb|bombing|war|flood|fire|injur|crash|assassin|murder|suicide|earthquake|disaster|slain|hostage|riot|protest turns violent)\b/i;

function isWholesomeEvent(text: string): boolean {
  return !SKIP_EVENT_PATTERN.test(text);
}

describe("formatHistoricalEvent", () => {
  it("leads with on this day and includes the year", () => {
    expect(
      formatHistoricalEvent({
        year: 1956,
        text: "The first Eurovision Song Contest is held in Lugano, Switzerland.",
      }),
    ).toBe(
      "On this day in 1956, the first Eurovision Song Contest is held in Lugano, Switzerland.",
    );
  });
});

describe("history event filtering", () => {
  it("skips violent or tragic events", () => {
    expect(isWholesomeEvent("A mass shooting occurs at a school.")).toBe(false);
    expect(
      isWholesomeEvent(
        "The discovery of particles consistent with the Higgs boson is announced.",
      ),
    ).toBe(true);
  });
});

describe("isLlmScriptMode", () => {
  it("treats history_today as API-backed content", async () => {
    const { isLlmScriptMode } = await import("@/lib/wakeup/llm-script");
    expect(isLlmScriptMode("history_today")).toBe(false);
    expect(isLlmScriptMode("fun_fact")).toBe(true);
  });
});
