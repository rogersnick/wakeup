import { describe, expect, it } from "vitest";
import { isLlmScriptMode } from "@/lib/wakeup/llm-script";

describe("isLlmScriptMode", () => {
  it("identifies LLM-only script modes", () => {
    expect(isLlmScriptMode("fun_fact")).toBe(true);
    expect(isLlmScriptMode("horoscope")).toBe(true);
    expect(isLlmScriptMode("history_today")).toBe(false);
    expect(isLlmScriptMode("weather_report")).toBe(false);
  });
});
