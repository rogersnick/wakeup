import type { User, Wakeup } from "@/lib/db/schema";
import { generateWakeUpAudio } from "@/lib/elevenlabs";
import { storeWakeUpAudio } from "@/lib/blob";
import { fetchWeatherForCity } from "@/lib/weather";
import { generateSurpriseScript } from "@/lib/wakeup/script-generator";

export type PreparedDynamicWakeUp = {
  scriptText: string;
  audioBlobUrl: string;
};

export async function prepareDynamicWakeUpAudio(
  wakeup: Wakeup,
  user: User,
): Promise<PreparedDynamicWakeUp> {
  if (!user.city?.trim()) {
    throw new Error("City is required for weather report wake-ups.");
  }

  const weather = await fetchWeatherForCity(user.city);
  const scriptText = await generateSurpriseScript({
    city: user.city,
    weather,
    timezone: user.timezone,
    firstName: user.displayName,
  });

  const audio = await generateWakeUpAudio(scriptText, wakeup.voiceId);
  const audioBlobUrl = await storeWakeUpAudio(wakeup.id, audio);

  return { scriptText, audioBlobUrl };
}
