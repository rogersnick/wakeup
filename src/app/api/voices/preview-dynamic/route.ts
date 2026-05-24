import { jsonError, requireUserId } from "@/lib/api";
import { generateWakeUpAudio } from "@/lib/elevenlabs";
import { getOrCreateUserWithProfile } from "@/lib/users";
import { resolveCityForWeather } from "@/lib/weather";
import { generateModeScript } from "@/lib/wakeup/script-generator";
import {
  assertValidScriptMode,
  userToProfileContext,
  validateScheduleMessage,
} from "@/lib/wakeup/validate-message";
import { isGeneratedMode, type WakeupScriptModeInput } from "@/lib/wakeup/modes";

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as {
      voiceId?: string;
      scriptMode?: WakeupScriptModeInput;
    };

    if (!body.voiceId) {
      return jsonError("voiceId is required.");
    }

    const user = await getOrCreateUserWithProfile(authResult.userId);
    const profile = userToProfileContext(user);
    const scriptMode = await validateScheduleMessage(body.scriptMode, profile);

    if (!isGeneratedMode(scriptMode)) {
      return jsonError("Preview requires a generated message mode.");
    }

    const resolvedCity = user.city?.trim()
      ? await resolveCityForWeather(user.city)
      : null;

    const scriptText = await generateModeScript({
      mode: scriptMode,
      timezone: user.timezone,
      firstName: user.displayName,
      profile: {
        ...profile,
        cityResolvedLabel: resolvedCity?.cityLabel ?? profile.cityResolvedLabel,
      },
      city: user.city,
      cityLabel: resolvedCity?.cityLabel,
    });

    const audio = await generateWakeUpAudio(scriptText, body.voiceId);

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Wakeup-Script": encodeURIComponent(scriptText),
        "X-Wakeup-Mode": assertValidScriptMode(scriptMode),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate preview.";
    return jsonError(message, 500);
  }
}
