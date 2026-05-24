import type { User, Wakeup } from "@/lib/db/schema";
import { generateWakeUpAudio } from "@/lib/elevenlabs";
import { storeWakeUpAudio } from "@/lib/blob";
import { resolveCityForWeather } from "@/lib/weather";
import { generateModeScript } from "@/lib/wakeup/script-generator";
import {
  getMissingPrerequisites,
  isGeneratedMode,
  normalizeScriptMode,
  resolveContentConfig,
  type UserProfileContext,
  type WakeupContentConfig,
} from "@/lib/wakeup/modes";

export type PreparedGeneratedWakeUp = {
  scriptText: string;
  audioBlobUrl: string;
};

function buildProfileFromUser(user: User): UserProfileContext {
  return {
    city: user.city,
    displayName: user.displayName,
    favoriteTeam: user.favoriteTeam,
    marketSymbols: user.marketSymbols,
    zodiacSign: user.zodiacSign as UserProfileContext["zodiacSign"],
  };
}

export function validateGeneratedModePrerequisites(
  mode: ReturnType<typeof normalizeScriptMode>,
  user: User,
  contentConfig?: WakeupContentConfig | null,
): void {
  if (!isGeneratedMode(mode)) {
    return;
  }

  const profile = buildProfileFromUser(user);
  const missing = getMissingPrerequisites(mode, profile, contentConfig);
  if (missing.length > 0) {
    throw new Error(`Missing profile data for ${mode.replaceAll("_", " ")} wake-ups.`);
  }
}

export async function prepareGeneratedWakeUpAudio(
  wakeup: Wakeup,
  user: User,
): Promise<PreparedGeneratedWakeUp> {
  const mode = normalizeScriptMode(wakeup.scriptMode);
  if (!isGeneratedMode(mode)) {
    throw new Error("Generated audio preparation requires a generated script mode.");
  }

  const contentConfig = (wakeup.contentConfig ?? null) as WakeupContentConfig | null;
  validateGeneratedModePrerequisites(mode, user, contentConfig);

  const profile = buildProfileFromUser(user);
  const resolvedCity = user.city?.trim()
    ? await resolveCityForWeather(user.city)
    : null;

  const scriptText = await generateModeScript({
    mode,
    timezone: user.timezone,
    firstName: user.displayName,
    profile: {
      ...profile,
      cityResolvedLabel: resolvedCity?.cityLabel ?? profile.cityResolvedLabel,
    },
    contentConfig,
    city: user.city,
    cityLabel: resolvedCity?.cityLabel,
  });

  const audio = await generateWakeUpAudio(scriptText, wakeup.voiceId);
  const audioBlobUrl = await storeWakeUpAudio(wakeup.id, audio);

  return { scriptText, audioBlobUrl };
}

/** @deprecated Use prepareGeneratedWakeUpAudio */
export async function prepareDynamicWakeUpAudio(
  wakeup: Wakeup,
  user: User,
): Promise<PreparedGeneratedWakeUp> {
  return prepareGeneratedWakeUpAudio(wakeup, user);
}
