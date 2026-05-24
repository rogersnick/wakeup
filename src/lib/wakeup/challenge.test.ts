import { describe, expect, it } from "vitest";
import {
  buildChallengeIntroScript,
  formatChallengePreviewLabel,
  generateChallenge,
  isChallengeAnswerCorrect,
  normalizeChallengeType,
} from "@/lib/wakeup/challenge";

describe("challenge", () => {
  it("normalizes unknown challenge types to quick_math", () => {
    expect(normalizeChallengeType("unknown")).toBe("quick_math");
    expect(normalizeChallengeType("pattern_continue")).toBe("pattern_continue");
    expect(normalizeChallengeType("audio_comprehension")).toBe("memory_echo");
  });

  it("generates single-digit quick math answers", () => {
    const challenge = generateChallenge({ type: "quick_math" });
    expect(challenge.answer).toMatch(/^\d$/);
    expect(challenge.spokenPrompt).toContain("Quick one");
  });

  it("generates single-digit pattern answers", () => {
    const challenge = generateChallenge({ type: "pattern_continue" });
    expect(challenge.answer).toMatch(/^\d$/);
    expect(challenge.type).toBe("pattern_continue");
    expect(challenge.spokenPrompt).toContain("Alright");
  });

  it("generates memory echo with three digits and middle answer", () => {
    const challenge = generateChallenge({ type: "memory_echo" });

    expect(challenge.type).toBe("memory_echo");
    expect(challenge.digits).toHaveLength(3);
    expect(challenge.answer).toBe(String(challenge.digits?.[1]));
    expect(challenge.spokenPrompt).toContain("listen close");
  });

  it("validates challenge answers exactly", () => {
    const challenge = generateChallenge({ type: "quick_math" });
    expect(isChallengeAnswerCorrect(challenge, challenge.answer)).toBe(true);
    expect(isChallengeAnswerCorrect(challenge, "0")).toBe(
      challenge.answer === "0",
    );
    expect(isChallengeAnswerCorrect(challenge, undefined)).toBe(false);
  });

  it("formats preview labels with fixed examples", () => {
    expect(formatChallengePreviewLabel("quick_math")).toBe(
      "Quick math — What is 5 plus 2?",
    );
    expect(formatChallengePreviewLabel("pattern_continue")).toBe(
      "Pattern continue — 2, 4, 6 — what comes next?",
    );
    expect(formatChallengePreviewLabel("memory_echo")).toBe(
      "Memory echo — 7, 2, 9 — what's the middle number?",
    );
  });

  it("builds challenge-first intro script", () => {
    const challenge = generateChallenge({ type: "memory_echo" });
    const intro = buildChallengeIntroScript(challenge);

    expect(intro).toContain("middle one");
    expect(intro.toLowerCase()).toContain("while your wake-up message plays");
    expect(intro).toContain("Press 9 any time to snooze");
  });
});
