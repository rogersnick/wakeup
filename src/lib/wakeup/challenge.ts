export type ChallengeType =
  | "quick_math"
  | "pattern_continue"
  | "memory_echo";

export type ChallengePayload = {
  type: ChallengeType;
  prompt: string;
  spokenPrompt: string;
  answer: string;
  attempts: number;
  promptAudioUrl?: string | null;
  digits?: number[];
};

const CHALLENGE_TYPES: ChallengeType[] = [
  "quick_math",
  "pattern_continue",
  "memory_echo",
];

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
] as const;

const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  quick_math: "Quick math",
  pattern_continue: "Pattern continue",
  memory_echo: "Memory echo",
};

export const CHALLENGE_EXAMPLES: Record<ChallengeType, string> = {
  quick_math: "What is 5 plus 2?",
  pattern_continue: "2, 4, 6 — what comes next?",
  memory_echo: "7, 2, 9 — what's the middle number?",
};

export function getChallengeTypeLabel(type: ChallengeType): string {
  return CHALLENGE_TYPE_LABELS[type];
}

export function formatChallengePreviewLabel(type: ChallengeType): string {
  return `${CHALLENGE_TYPE_LABELS[type]} — ${CHALLENGE_EXAMPLES[type]}`;
}

export function isChallengeType(value: string): value is ChallengeType {
  return CHALLENGE_TYPES.includes(value as ChallengeType);
}

export function normalizeChallengeType(
  value: string | null | undefined,
): ChallengeType {
  if (value === "audio_comprehension") {
    return "memory_echo";
  }
  if (value && isChallengeType(value)) {
    return value;
  }
  return "quick_math";
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digitWord(digit: number) {
  return NUMBER_WORDS[digit] ?? String(digit);
}

function stripKeypadInstruction(text: string) {
  return text
    .replace(/ Press the answer on your keypad\.?/i, "")
    .replace(/ Press one digit on your keypad\.?/i, "")
    .replace(/ Press it now\.?/i, "")
    .trim();
}

function generateQuickMathChallenge(): ChallengePayload {
  const a = randomInt(2, 9);
  const b = randomInt(1, 5);
  const useAddition = Math.random() > 0.5;

  if (useAddition) {
    const answer = a + b;
    if (answer > 9) {
      const question = `What is ${a + 1} minus 1?`;
      return {
        type: "quick_math",
        prompt: `${question} Enter your answer at any time while your wake-up message plays.`,
        spokenPrompt: `Quick one. ${question.toLowerCase()} Enter your answer at any time while your wake-up message plays.`,
        answer: String(a),
        attempts: 0,
      };
    }
    const question = `What is ${a} plus ${b}?`;
    return {
      type: "quick_math",
      prompt: `${question} Enter your answer at any time while your wake-up message plays.`,
      spokenPrompt: `Quick one. ${question.toLowerCase()} Enter your answer at any time while your wake-up message plays.`,
      answer: String(answer),
      attempts: 0,
    };
  }

  const larger = Math.max(a, b);
  const smaller = Math.min(a, b);
  const answer = larger - smaller;
  const question = `What is ${larger} minus ${smaller}?`;

  return {
    type: "quick_math",
    prompt: `${question} Enter your answer at any time while your wake-up message plays.`,
    spokenPrompt: `Quick one. ${question.toLowerCase()} Enter your answer at any time while your wake-up message plays.`,
    answer: String(answer),
    attempts: 0,
  };
}

function generatePatternChallenge(): ChallengePayload {
  const patterns = [
    { prompt: "2, 4, 6. What comes next?", spoken: "two, four, six... what comes next?", answer: "8" },
    { prompt: "1, 3, 5. What comes next?", spoken: "one, three, five... what comes next?", answer: "7" },
    {
      prompt: "3, 6, 9. What is the last digit of the next number?",
      spoken: "three, six, nine... what's the last digit of the next number?",
      answer: "2",
    },
    {
      prompt: "5, 10, 15. What is the last digit of the next number?",
      spoken: "five, ten, fifteen... what's the last digit of the next number?",
      answer: "2",
    },
    { prompt: "1, 2, 3. What comes next?", spoken: "one, two, three... what comes next?", answer: "4" },
  ];

  const pattern = patterns[randomInt(0, patterns.length - 1)]!;

  return {
    type: "pattern_continue",
    prompt: `${pattern.prompt} Enter one digit at any time while your wake-up message plays.`,
    spokenPrompt: `Alright. ${pattern.spoken} Enter one digit at any time while your wake-up message plays.`,
    answer: pattern.answer,
    attempts: 0,
  };
}

function generateMemoryEchoChallenge(): ChallengePayload {
  const digits = Array.from({ length: 3 }, () => randomInt(1, 9));
  const answer = String(digits[1]);
  const spokenDigits = digits.map(digitWord).join("... ");

  return {
    type: "memory_echo",
    prompt: `Remember these three numbers: ${digits.join(", ")}. What's the middle one? Enter one digit at any time while your wake-up message plays.`,
    spokenPrompt: `Okay, listen close. ${spokenDigits}. What's the middle number? Enter one digit at any time while your wake-up message plays.`,
    answer,
    attempts: 0,
    digits,
  };
}

export function buildChallengeIntroScript(challenge: ChallengePayload): string {
  const question = stripKeypadInstruction(challenge.prompt);
  return `${question} Press 9 any time to snooze.`;
}

export function generateChallenge(input: {
  type: ChallengeType;
  scriptText?: string | null;
}): ChallengePayload {
  switch (input.type) {
    case "pattern_continue":
      return generatePatternChallenge();
    case "memory_echo":
      return generateMemoryEchoChallenge();
    case "quick_math":
    default:
      return generateQuickMathChallenge();
  }
}

export function isChallengeAnswerCorrect(
  challenge: ChallengePayload,
  digits: string | undefined,
): boolean {
  if (!digits) {
    return false;
  }

  return digits.trim() === challenge.answer;
}

export function challengeRetryPrompt(type: ChallengeType): string {
  switch (type) {
    case "pattern_continue":
      return "Not quite... let's try another pattern.";
    case "memory_echo":
      return "That wasn't it... listen again.";
    case "quick_math":
    default:
      return "Not quite... here is another one.";
  }
}
