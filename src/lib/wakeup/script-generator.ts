import { requireEnv } from "@/lib/env";
import {
  buildContentContext,
  fetchContentForMode,
} from "@/lib/content/fetch-content";
import type { ContentPayload } from "@/lib/content/types";
import { payloadToPromptLines } from "@/lib/content/types";
import type { WeatherSnapshot } from "@/lib/weather";
import {
  generateDirectLlmScript,
  isLlmScriptMode,
} from "@/lib/wakeup/llm-script";
import {
  normalizeScriptMode,
  resolveContentConfig,
  type GeneratedScriptMode,
  type UserProfileContext,
  type WakeupContentConfig,
} from "@/lib/wakeup/modes";
import { normalizeScriptForSpeech } from "@/lib/tts-format";

const MAX_SCRIPT_LENGTH = 400;
const MIN_SCRIPT_LENGTH = 250;

export type GenerateScriptInput = {
  mode: GeneratedScriptMode | "dynamic";
  timezone: string;
  firstName?: string | null;
  profile: UserProfileContext;
  contentConfig?: WakeupContentConfig | null;
  city?: string | null;
  cityLabel?: string | null;
  weather?: WeatherSnapshot | null;
};

const MODE_TONE: Record<GeneratedScriptMode, string> = {
  weather_report: "warm and practical",
  local_news: "informative and concise",
  sports_scores: "energetic and upbeat",
  market_brief: "clear and neutral",
  horoscope: "playful and encouraging",
  daily_motivation: "warm and motivating",
  history_today: "curious and engaging",
  word_of_day: "friendly and educational",
  fun_fact: "light and fun",
};

export function buildFallbackScript(input: GenerateScriptInput): string {
  const mode = normalizeScriptMode(input.mode) as GeneratedScriptMode;
  const greeting = input.firstName?.trim()
    ? `Good morning, ${input.firstName.trim()}!`
    : "Good morning!";
  const cityLabel = input.cityLabel ?? input.profile.city?.trim();

  switch (mode) {
    case "weather_report":
      if (input.weather) {
        return `${greeting} It's ${input.weather.tempC} degrees and ${input.weather.description} in ${input.weather.cityLabel}. Time to get up and start your day.`;
      }
      return cityLabel
        ? `${greeting} Time to get up and start your day in ${cityLabel}.`
        : `${greeting} Time to get up and start your day.`;
    case "local_news":
      return cityLabel
        ? `${greeting} Here's your local news brief for ${cityLabel}. Time to get up and see what's happening today.`
        : `${greeting} Time to get up and start your day.`;
    case "sports_scores":
      return `${greeting} Here's what's next on your team's schedule. Time to get up and start your day.`;
    case "market_brief":
      return `${greeting} Here's your market brief. Time to get up and start your day.`;
    case "horoscope":
      return `${greeting} Here's your horoscope for today. Time to get up and make it a great day.`;
    case "daily_motivation":
      return `${greeting} You've got a great day ahead. Take a deep breath, get out of bed, and make it count.`;
    case "history_today":
      return `${greeting} On this day in history, notable things have happened — today is yours to write. Time to get up and start your day.`;
    case "word_of_day":
      return `${greeting} Today's word is momentum — forward motion that builds with action. Time to get up and create some.`;
    case "fun_fact":
      return `${greeting} Here's a fun fact to start your day: honey never spoils. Now get up and do something sweet with your morning.`;
    default:
      return `${greeting} Time to get up and start your day.`;
  }
}

function trimScript(text: string): string {
  const trimmed = normalizeScriptForSpeech(text.trim().replace(/^["']|["']$/g, ""));
  if (trimmed.length <= MAX_SCRIPT_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_SCRIPT_LENGTH - 3).trimEnd()}...`;
}

function buildPromptFromPayload(payload: ContentPayload): string {
  return payloadToPromptLines(payload).join("\n");
}

export async function generateModeScript(
  input: GenerateScriptInput,
): Promise<string> {
  const mode = normalizeScriptMode(input.mode) as GeneratedScriptMode;

  if (isLlmScriptMode(mode)) {
    const resolved = resolveContentConfig(input.profile, input.contentConfig);
    const script = await generateDirectLlmScript({
      mode,
      timezone: input.timezone,
      firstName: input.firstName,
      zodiacSign: mode === "horoscope" ? resolved.zodiacSign : undefined,
    });
    return script ?? buildFallbackScript(input);
  }

  const resolved = resolveContentConfig(input.profile, input.contentConfig);

  try {
    const payload = await fetchContentForMode(
      buildContentContext({
        mode,
        timezone: input.timezone,
        city: input.city ?? input.profile.city,
        cityLabel: input.cityLabel ?? input.profile.cityResolvedLabel,
        favoriteTeam: resolved.favoriteTeam,
        marketSymbols: resolved.marketSymbols,
        zodiacSign: resolved.zodiacSign,
        firstName: input.firstName,
      }),
    );

    if (payload.source === "fallback") {
      return buildFallbackFromPayload(input, payload);
    }

    if (mode === "history_today" && payload.source === "api") {
      return buildFallbackFromPayload(input, payload);
    }

    if (mode === "local_news" && payload.source === "api") {
      return buildLocalNewsScript(input, payload);
    }

    if (mode === "market_brief" && payload.source === "api") {
      return buildMarketBriefScript(input, payload);
    }

    const composed = await composeScriptWithLlm(input, mode, payload);
    return composed ?? buildFallbackFromPayload(input, payload);
  } catch {
    return buildFallbackScript(input);
  }
}

function isGenericFallbackMessage(message: string): boolean {
  return (
    message.startsWith("Could not") ||
    message.startsWith("Content is unavailable") ||
    message.startsWith("No schedule or recent results") ||
    message.startsWith("No recent headlines") ||
    message.includes("unavailable right now")
  );
}

function buildLocalNewsScript(
  input: GenerateScriptInput,
  payload: ContentPayload,
): string {
  const greeting = input.firstName?.trim()
    ? `Good morning, ${input.firstName.trim()}!`
    : "Good morning!";
  const cityLabel =
    input.cityLabel ??
    input.profile.cityResolvedLabel ??
    input.profile.city?.trim();
  const headlines = payload.bullets
    .map((bullet) => bullet.value.trim())
    .filter((value) => value && !isGenericFallbackMessage(value))
    .slice(0, 2);

  if (headlines.length === 0) {
    return buildFallbackScript(input);
  }

  const intro = cityLabel
    ? `In local news for ${cityLabel}: `
    : "In local news: ";

  if (headlines.length === 1) {
    return trimScript(
      `${greeting} ${intro}${headlines[0]}. Time to get up and start your day.`,
    );
  }

  return trimScript(
    `${greeting} ${intro}${headlines[0]}. Also, ${headlines[1]}. Time to get up and start your day.`,
  );
}

function buildMarketBriefScript(
  input: GenerateScriptInput,
  payload: ContentPayload,
): string {
  const greeting = input.firstName?.trim()
    ? `Good morning, ${input.firstName.trim()}!`
    : "Good morning!";
  const quotes = payload.bullets
    .map((bullet) => bullet.value.trim())
    .filter((value) => value && !isGenericFallbackMessage(value))
    .slice(0, 3);
  const headline = payload.notes
    .find((note) => note.startsWith("Headline:"))
    ?.replace(/^Headline:\s*/, "")
    .trim();

  if (quotes.length === 0) {
    return buildFallbackScript(input);
  }

  let body =
    quotes.length === 1
      ? `Your market brief: ${quotes[0]}.`
      : `Your market brief: ${quotes.join(". ")}.`;

  if (headline) {
    body += ` In the news: ${headline}.`;
  }

  return trimScript(`${greeting} ${body} Time to get up and start your day.`);
}

function buildFallbackFromPayload(
  input: GenerateScriptInput,
  payload: ContentPayload,
): string {
  const detail = payload.bullets[0]?.value;
  if (!detail || isGenericFallbackMessage(detail)) {
    return buildFallbackScript(input);
  }

  const greeting = input.firstName?.trim()
    ? `Good morning, ${input.firstName.trim()}!`
    : "Good morning!";
  return trimScript(`${greeting} ${detail} Time to get up and start your day.`);
}

async function composeScriptWithLlm(
  input: GenerateScriptInput,
  mode: GeneratedScriptMode,
  payload: ContentPayload,
): Promise<string | null> {
  try {
    const apiKey = requireEnv("OPENAI_API_KEY");
    const nameLine = input.firstName?.trim()
      ? `Address the user as ${input.firstName.trim()} at the start of the script.`
      : "Do not invent a name for the user.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: [
              "You write short wake-up call scripts to be read aloud by text-to-speech.",
              "Rules:",
              `- Length: ${MIN_SCRIPT_LENGTH}-${MAX_SCRIPT_LENGTH} characters.`,
              "- Friendly, positive, and concise.",
              "- Weave in the provided content naturally — not as a formal bulletin.",
              "- Do not invent facts beyond the provided content.",
              "- No profanity, slurs, medical advice, legal advice, or scary content.",
              "- Do not pretend to be a real person or reference being an AI.",
              "- Return only the script text with no quotes or labels.",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              `Write a wake-up call script for timezone ${input.timezone}.`,
              `Content type: ${mode.replaceAll("_", " ")}.`,
              `Tone preference: ${MODE_TONE[mode]}.`,
              "Use this source material:",
              buildPromptFromPayload(payload),
              nameLine,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return null;
    }

    return trimScript(content);
  } catch {
    return null;
  }
}

/** @deprecated Use generateModeScript */
export async function generateSurpriseScript(input: {
  city: string;
  weather: WeatherSnapshot | null;
  timezone: string;
  firstName?: string | null;
}): Promise<string> {
  return generateModeScript({
    mode: "weather_report",
    timezone: input.timezone,
    firstName: input.firstName,
    profile: { city: input.city },
    city: input.city,
    cityLabel: input.weather?.cityLabel,
    weather: input.weather,
  });
}
