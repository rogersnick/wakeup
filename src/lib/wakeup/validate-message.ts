import {
  CITY_WEATHER_NOT_FOUND_ERROR,
  resolveCityForWeather,
} from "@/lib/weather";
import {
  getMissingPrerequisites,
  getPrerequisiteMessage,
  isGeneratedMode,
  isWakeupScriptMode,
  normalizeScriptMode,
  parseMarketSymbols,
  resolveContentConfig,
  type UserProfileContext,
  type WakeupContentConfig,
  type WakeupScriptMode,
  type WakeupScriptModeInput,
} from "@/lib/wakeup/modes";

export function assertValidScriptMode(
  mode: string | undefined,
): WakeupScriptMode {
  const normalized = normalizeScriptMode(mode as WakeupScriptModeInput);
  if (!isWakeupScriptMode(normalized)) {
    throw new Error("Invalid wake-up message mode.");
  }
  return normalized;
}

export function assertGeneratedModePrerequisites(
  mode: WakeupScriptMode,
  profile: UserProfileContext,
  contentConfig?: WakeupContentConfig | null,
): void {
  if (!isGeneratedMode(mode)) {
    return;
  }

  const missing = getMissingPrerequisites(mode, profile, contentConfig);
  if (missing.length > 0) {
    throw new Error(getPrerequisiteMessage(missing[0]!));
  }

  if (missing.includes("city") || mode === "weather_report" || mode === "local_news") {
    const city = profile.city?.trim();
    if (city) {
      void city;
    }
  }
}

export async function assertResolvableCity(profile: UserProfileContext): Promise<void> {
  const city = profile.city?.trim();
  if (!city) {
    throw new Error(getPrerequisiteMessage("city"));
  }

  const resolved = await resolveCityForWeather(city);
  if (!resolved) {
    throw new Error(CITY_WEATHER_NOT_FOUND_ERROR);
  }
}

export async function validateScheduleMessage(
  modeInput: WakeupScriptModeInput | undefined,
  profile: UserProfileContext,
  contentConfig?: WakeupContentConfig | null,
): Promise<WakeupScriptMode> {
  const mode = assertValidScriptMode(modeInput);

  if (!isGeneratedMode(mode)) {
    return mode;
  }

  const missing = getMissingPrerequisites(mode, profile, contentConfig);
  if (missing.includes("city")) {
    await assertResolvableCity(profile);
  }

  const otherMissing = missing.filter((item) => item !== "city");
  if (otherMissing.length > 0) {
    throw new Error(getPrerequisiteMessage(otherMissing[0]!));
  }

  return mode;
}

export function sanitizeContentConfig(
  mode: WakeupScriptMode,
  profile: UserProfileContext,
  config?: WakeupContentConfig | null,
): WakeupContentConfig | null {
  if (!isGeneratedMode(mode)) {
    return null;
  }

  const resolved = resolveContentConfig(profile, config);
  if (mode === "market_brief" && resolved.marketSymbols?.length) {
    return { marketSymbols: resolved.marketSymbols };
  }
  if (mode === "sports_scores" && resolved.favoriteTeam) {
    return { favoriteTeam: resolved.favoriteTeam };
  }
  if (mode === "horoscope" && resolved.zodiacSign) {
    return { zodiacSign: resolved.zodiacSign };
  }

  return null;
}

export function userToProfileContext(user: {
  city?: string | null;
  displayName?: string | null;
  favoriteTeam?: string | null;
  marketSymbols?: string | null;
  zodiacSign?: string | null;
}): UserProfileContext {
  return {
    city: user.city,
    displayName: user.displayName,
    favoriteTeam: user.favoriteTeam,
    marketSymbols: user.marketSymbols,
    zodiacSign: user.zodiacSign as UserProfileContext["zodiacSign"],
  };
}

export function parseContentConfigFromBody(
  body: Record<string, unknown> | undefined,
): WakeupContentConfig | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const config: WakeupContentConfig = {};
  if (typeof body.favoriteTeam === "string" && body.favoriteTeam.trim()) {
    config.favoriteTeam = body.favoriteTeam.trim();
  }
  if (typeof body.zodiacSign === "string" && body.zodiacSign.trim()) {
    config.zodiacSign = body.zodiacSign.trim().toLowerCase() as WakeupContentConfig["zodiacSign"];
  }
  if (Array.isArray(body.marketSymbols)) {
    config.marketSymbols = parseMarketSymbols(body.marketSymbols.join(","));
  } else if (typeof body.marketSymbols === "string") {
    config.marketSymbols = parseMarketSymbols(body.marketSymbols);
  }

  return Object.keys(config).length > 0 ? config : null;
}
