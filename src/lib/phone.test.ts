import { describe, expect, it } from "vitest";
import { normalizePhoneE164 } from "@/lib/phone";

describe("normalizePhoneE164", () => {
  it("converts formatted US numbers", () => {
    expect(normalizePhoneE164("(555) 123-4567")).toBe("+15551234567");
  });

  it("accepts E164 input", () => {
    expect(normalizePhoneE164("+15551234567")).toBe("+15551234567");
  });

  it("accepts 11-digit numbers with country code", () => {
    expect(normalizePhoneE164("15551234567")).toBe("+15551234567");
  });
});
