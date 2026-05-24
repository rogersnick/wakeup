import { requireEnv } from "@/lib/env";
import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import { createFallbackPayload } from "@/lib/content/types";
import type { GeneratedScriptMode } from "@/lib/wakeup/modes";

type LlmMode = Extract<
  GeneratedScriptMode,
  "daily_motivation" | "history_today" | "word_of_day" | "fun_fact"
>;

const LLM_MODE_INSTRUCTIONS: Record<LlmMode, string> = {
  daily_motivation:
    "Write an original, uplifting motivational message for starting the day. Do not quote famous people.",
  history_today:
    "Share one interesting historical event that happened on today's calendar date. Include the year.",
  word_of_day:
    "Teach one useful English word with a concise definition and a short example sentence.",
  fun_fact:
    "Share one surprising but wholesome fun fact suitable for a morning wake-up.",
};

export async function fetchLlmContent(
  context: ContentFetchContext,
): Promise<ContentPayload> {
  const mode = context.mode as LlmMode;
  if (!(mode in LLM_MODE_INSTRUCTIONS)) {
    return createFallbackPayload(context, "Content is unavailable right now.");
  }

  try {
    const apiKey = requireEnv("OPENAI_API_KEY");
    const now = context.now ?? new Date();
    const dateLabel = now.toLocaleDateString("en-US", {
      timeZone: context.timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
    });

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
              "You produce concise factual snippets for wake-up call scripts.",
              "Return JSON only with keys: headline, detail.",
              "headline: short topic label.",
              "detail: one or two sentences, max 220 characters total.",
              "No profanity, medical advice, politics, or scary content.",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              `Date: ${dateLabel}`,
              `Timezone: ${context.timezone}`,
              LLM_MODE_INSTRUCTIONS[mode],
            ].join("\n"),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return createFallbackPayload(context, "Could not generate content right now.");
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return createFallbackPayload(context, "Could not generate content right now.");
    }

    const parsed = JSON.parse(content) as {
      headline?: string;
      detail?: string;
    };

    if (!parsed.detail?.trim()) {
      return createFallbackPayload(context, "Could not generate content right now.");
    }

    return {
      mode,
      headline: parsed.headline?.trim() || getDefaultHeadline(mode),
      bullets: [{ label: "Detail", value: parsed.detail.trim() }],
      notes: [],
      source: "llm",
    };
  } catch {
    return createFallbackPayload(context, "Could not generate content right now.");
  }
}

function getDefaultHeadline(mode: LlmMode): string {
  switch (mode) {
    case "daily_motivation":
      return "Daily motivation";
    case "history_today":
      return "On this day";
    case "word_of_day":
      return "Word of the day";
    case "fun_fact":
      return "Fun fact";
    default:
      return "Wake-up";
  }
}
