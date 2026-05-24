import { describe, expect, it } from "vitest";
import { createFallbackPayload } from "@/lib/content/types";

describe("content payload helpers", () => {
  it("builds fallback payload", () => {
    const payload = createFallbackPayload(
      {
        mode: "fun_fact",
        timezone: "America/Toronto",
      },
      "Could not load content.",
    );

    expect(payload.source).toBe("fallback");
    expect(payload.bullets[0]?.value).toBe("Could not load content.");
  });
});
