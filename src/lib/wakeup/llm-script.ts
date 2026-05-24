import { requireEnv } from "@/lib/env";
import type { GeneratedScriptMode } from "@/lib/wakeup/modes";
import { normalizeScriptForSpeech } from "@/lib/tts-format";

export const LLM_SCRIPT_MODES = [
  "daily_motivation",
  "horoscope",
  "word_of_day",
  "fun_fact",
] as const;

export type LlmScriptMode = (typeof LLM_SCRIPT_MODES)[number];

export function isLlmScriptMode(mode: GeneratedScriptMode): mode is LlmScriptMode {
  return (LLM_SCRIPT_MODES as readonly string[]).includes(mode);
}

const LLM_MODE_INSTRUCTIONS: Record<LlmScriptMode, string> = {
  daily_motivation:
    "Write an original, uplifting motivational wake-up message. Do not quote famous people.",
  horoscope:
    "Write a playful daily horoscope with a specific positive reading for today. Mention the listener's zodiac sign naturally. Keep it light and encouraging, not doom-and-gloom or overly mystical.",
  word_of_day:
    "Teach one useful English word with a concise definition woven naturally into the message.",
  fun_fact:
    "Share one surprising but wholesome fun fact suitable for a morning wake-up.",
};

const MODE_TONE: Record<LlmScriptMode, string> = {
  daily_motivation: "warm and motivating",
  horoscope: "playful and encouraging",
  word_of_day: "friendly and educational",
  fun_fact: "light and fun",
};

const MAX_SCRIPT_LENGTH = 400;
const MIN_SCRIPT_LENGTH = 250;

function trimScript(text: string): string {
  const trimmed = normalizeScriptForSpeech(text.trim().replace(/^["']|["']$/g, ""));
  if (trimmed.length <= MAX_SCRIPT_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_SCRIPT_LENGTH - 3).trimEnd()}...`;
}

export type DirectLlmScriptInput = {
  mode: LlmScriptMode;
  timezone: string;
  firstName?: string | null;
  zodiacSign?: string | null;
  now?: Date;
};

function formatZodiacSign(sign: string): string {
  return sign.charAt(0).toUpperCase() + sign.slice(1);
}

export async function generateDirectLlmScript(
  input: DirectLlmScriptInput,
): Promise<string | null> {
  if (input.mode === "horoscope" && !input.zodiacSign?.trim()) {
    console.error("[llm-script] horoscope mode requires a zodiac sign");
    return null;
  }

  try {
    const apiKey = requireEnv("OPENAI_API_KEY");
    const now = input.now ?? new Date();
    const dateLabel = now.toLocaleDateString("en-US", {
      timeZone: input.timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const nameLine = input.firstName?.trim()
      ? `Address the user as ${input.firstName.trim()} at the start.`
      : "Do not invent a name for the user.";
    const zodiacLine =
      input.mode === "horoscope" && input.zodiacSign?.trim()
        ? `The listener is a ${formatZodiacSign(input.zodiacSign.trim())}.`
        : "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.9,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content: [
              "You write short wake-up call scripts to be read aloud by text-to-speech.",
              "Rules:",
              `- Length: ${MIN_SCRIPT_LENGTH}-${MAX_SCRIPT_LENGTH} characters.`,
              `- Tone: ${MODE_TONE[input.mode]}.`,
              "- Friendly, positive, and concise.",
              "- No profanity, slurs, medical advice, legal advice, or scary content.",
              "- Do not pretend to be a real person or reference being an AI.",
              "- Return only the script text with no quotes or labels.",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              `Write a wake-up call script for timezone ${input.timezone}.`,
              `Date: ${dateLabel}`,
              LLM_MODE_INSTRUCTIONS[input.mode],
              nameLine,
              zodiacLine,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[llm-script] OpenAI error for ${input.mode}: ${response.status}`,
        errorBody.slice(0, 500),
      );
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.error(`[llm-script] empty response for ${input.mode}`);
      return null;
    }

    return trimScript(content);
  } catch (error) {
    console.error(`[llm-script] failed for ${input.mode}`, error);
    return null;
  }
}
