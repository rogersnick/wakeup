import { jsonError, requireUserId } from "@/lib/api";
import { generateWakeUpAudio } from "@/lib/elevenlabs";
import { fetchWeatherForCity } from "@/lib/weather";
import { getOrCreateUserWithProfile } from "@/lib/users";
import { generateSurpriseScript } from "@/lib/wakeup/script-generator";

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as {
      voiceId?: string;
    };

    if (!body.voiceId) {
      return jsonError("voiceId is required.");
    }

    const user = await getOrCreateUserWithProfile(authResult.userId);
    if (!user.city?.trim()) {
      return jsonError("City is required for weather report previews.");
    }

    const weather = await fetchWeatherForCity(user.city);
    const scriptText = await generateSurpriseScript({
      city: user.city,
      weather,
      timezone: user.timezone,
      firstName: user.displayName,
    });

    const audio = await generateWakeUpAudio(scriptText, body.voiceId);

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Wakeup-Script": encodeURIComponent(scriptText),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate preview.";
    return jsonError(message, 500);
  }
}
