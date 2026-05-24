import { requireEnv } from "@/lib/env";
import type { WeatherSnapshot } from "@/lib/weather";

const MAX_SCRIPT_LENGTH = 400;
const MIN_SCRIPT_LENGTH = 250;

export type GenerateSurpriseScriptInput = {
  city: string;
  weather: WeatherSnapshot | null;
  timezone: string;
  toneHint?: string | null;
};

export function buildFallbackScript(input: GenerateSurpriseScriptInput): string {
  const cityLabel = input.weather?.cityLabel ?? input.city;
  if (input.weather) {
    return `Good morning! It's ${input.weather.tempF} degrees and ${input.weather.description} in ${cityLabel}. Time to get up and start your day.`;
  }
  return `Good morning from ${cityLabel}! Time to get up and start your day.`;
}

function trimScript(text: string): string {
  const trimmed = text.trim().replace(/^["']|["']$/g, "");
  if (trimmed.length <= MAX_SCRIPT_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_SCRIPT_LENGTH - 3).trimEnd()}...`;
}

export async function generateSurpriseScript(
  input: GenerateSurpriseScriptInput,
): Promise<string> {
  try {
    const apiKey = requireEnv("OPENAI_API_KEY");
    const weatherLine = input.weather
      ? `Current weather in ${input.weather.cityLabel}: ${input.weather.tempF}°F and ${input.weather.description}.`
      : `Location: ${input.city}. Weather is unavailable — do not invent specific weather details.`;

    const toneLine = input.toneHint?.trim()
      ? `Tone preference: ${input.toneHint.trim()}.`
      : "Tone preference: warm and motivating.";

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
              "- Weave in the weather naturally if provided — not as a formal forecast.",
              "- No profanity, slurs, medical advice, legal advice, or scary content.",
              "- Do not pretend to be a real person or reference being an AI.",
              "- Return only the script text with no quotes or labels.",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              `Write a wake-up call script for someone in timezone ${input.timezone}.`,
              weatherLine,
              toneLine,
            ].join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return buildFallbackScript(input);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return buildFallbackScript(input);
    }

    return trimScript(content);
  } catch {
    return buildFallbackScript(input);
  }
}
