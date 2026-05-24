export const WAKEUP_SCRIPT_MODES = [
  "static",
  "weather_report",
  "local_news",
  "sports_scores",
  "market_brief",
  "horoscope",
  "daily_motivation",
  "history_today",
  "word_of_day",
  "fun_fact",
] as const;

export type WakeupScriptMode = (typeof WAKEUP_SCRIPT_MODES)[number];

/** @deprecated Legacy DB value — normalized to weather_report */
export type LegacyWakeupScriptMode = "dynamic";

export type WakeupScriptModeInput = WakeupScriptMode | LegacyWakeupScriptMode;

export const GENERATED_SCRIPT_MODES = WAKEUP_SCRIPT_MODES.filter(
  (mode) => mode !== "static",
) as Exclude<WakeupScriptMode, "static">[];

export type GeneratedScriptMode = (typeof GENERATED_SCRIPT_MODES)[number];

export const ZODIAC_SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export type WakeupContentConfig = {
  marketSymbols?: string[];
  favoriteTeam?: string;
  zodiacSign?: ZodiacSign;
};

export type UserProfileContext = {
  city?: string | null;
  cityResolvedLabel?: string | null;
  displayName?: string | null;
  favoriteTeam?: string | null;
  marketSymbols?: string | null;
  zodiacSign?: ZodiacSign | null;
};

export type ModeDefinition = {
  id: WakeupScriptMode;
  label: string;
  description: string;
  category: "custom" | "local" | "info" | "fun";
};

export const MODE_DEFINITIONS: ModeDefinition[] = [
  {
    id: "static",
    label: "Write my own",
    description: "Your custom wake-up message.",
    category: "custom",
  },
  {
    id: "weather_report",
    label: "Weather report",
    description: "Local conditions and a motivating start.",
    category: "local",
  },
  {
    id: "local_news",
    label: "Local news",
    description: "Recent headlines for your city from Google News.",
    category: "local",
  },
  {
    id: "sports_scores",
    label: "Sports schedule",
    description: "Next game and recent results for your team.",
    category: "info",
  },
  {
    id: "market_brief",
    label: "Market brief",
    description: "Live quotes and headlines for your watchlist.",
    category: "info",
  },
  {
    id: "horoscope",
    label: "Horoscope",
    description: "A personalized daily horoscope for your sign.",
    category: "fun",
  },
  {
    id: "daily_motivation",
    label: "Daily motivation",
    description: "Fresh encouragement every morning.",
    category: "fun",
  },
  {
    id: "history_today",
    label: "On this day",
    description: "A real historical event from today's date.",
    category: "fun",
  },
  {
    id: "word_of_day",
    label: "Word of the day",
    description: "Learn a new word to start the day.",
    category: "fun",
  },
  {
    id: "fun_fact",
    label: "Fun fact",
    description: "Random trivia to wake up your brain.",
    category: "fun",
  },
];

export function normalizeScriptMode(
  mode: WakeupScriptModeInput | null | undefined,
): WakeupScriptMode {
  if (!mode || mode === "dynamic") {
    return "weather_report";
  }
  return mode;
}

export function isGeneratedMode(
  mode: WakeupScriptModeInput | null | undefined,
): mode is GeneratedScriptMode | LegacyWakeupScriptMode {
  return normalizeScriptMode(mode) !== "static";
}

export function isWakeupScriptMode(value: string): value is WakeupScriptMode {
  return (WAKEUP_SCRIPT_MODES as readonly string[]).includes(value);
}

export function isZodiacSign(value: string): value is ZodiacSign {
  return (ZODIAC_SIGNS as readonly string[]).includes(value);
}

export function getModeDefinition(mode: WakeupScriptModeInput): ModeDefinition {
  const normalized = normalizeScriptMode(mode);
  return (
    MODE_DEFINITIONS.find((definition) => definition.id === normalized) ??
    MODE_DEFINITIONS[0]
  );
}

export function getModeLabel(mode: WakeupScriptModeInput): string {
  return getModeDefinition(mode).label;
}

export type ModePrerequisite =
  | "city"
  | "favoriteTeam"
  | "marketSymbols"
  | "zodiacSign";

export function getModePrerequisites(mode: WakeupScriptMode): ModePrerequisite[] {
  switch (mode) {
    case "weather_report":
    case "local_news":
      return ["city"];
    case "sports_scores":
      return ["favoriteTeam"];
    case "market_brief":
      return ["marketSymbols"];
    case "horoscope":
      return ["zodiacSign"];
    default:
      return [];
  }
}

export function parseMarketSymbols(value: string | null | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[,;\s]+/)
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);
}

export function formatMarketSymbols(symbols: string[]): string {
  return symbols.join(", ");
}

export function resolveContentConfig(
  profile: UserProfileContext,
  config?: WakeupContentConfig | null,
): WakeupContentConfig {
  return {
    favoriteTeam: profile.favoriteTeam?.trim() || config?.favoriteTeam?.trim() || undefined,
    marketSymbols:
      parseMarketSymbols(profile.marketSymbols).length
        ? parseMarketSymbols(profile.marketSymbols)
        : config?.marketSymbols?.length
          ? config.marketSymbols
          : [],
    zodiacSign: profile.zodiacSign ?? config?.zodiacSign ?? undefined,
  };
}

export function getMissingPrerequisites(
  mode: WakeupScriptMode,
  profile: UserProfileContext,
  config?: WakeupContentConfig | null,
): ModePrerequisite[] {
  const prerequisites = getModePrerequisites(mode);
  const resolved = resolveContentConfig(profile, config);
  const hasValidCity = Boolean(profile.cityResolvedLabel ?? profile.city?.trim());

  return prerequisites.filter((prerequisite) => {
    switch (prerequisite) {
      case "city":
        return !hasValidCity;
      case "favoriteTeam":
        return !resolved.favoriteTeam;
      case "marketSymbols":
        return !resolved.marketSymbols?.length;
      case "zodiacSign":
        return !resolved.zodiacSign;
      default:
        return false;
    }
  });
}

export function getPrerequisiteMessage(prerequisite: ModePrerequisite): string {
  switch (prerequisite) {
    case "city":
      return "Add your city to enable this wake-up.";
    case "favoriteTeam":
      return "Add your favorite team to enable sports scores.";
    case "marketSymbols":
      return "Add stock symbols (e.g. AAPL, TSLA) for your market brief.";
    case "zodiacSign":
      return "Choose your zodiac sign for daily horoscope wake-ups.";
    default:
      return "Complete your profile to enable this wake-up.";
  }
}

export function formatModeSummary(
  mode: WakeupScriptModeInput,
  profile: UserProfileContext,
  config?: WakeupContentConfig | null,
): string {
  const normalized = normalizeScriptMode(mode);
  const label = getModeLabel(normalized);
  const resolved = resolveContentConfig(profile, config);
  const city = profile.cityResolvedLabel ?? profile.city?.trim();

  switch (normalized) {
    case "static":
      return "Custom message";
    case "weather_report":
      return city ? `Real-time weather for ${city}` : label;
    case "local_news":
      return city ? `Local news for ${city}` : label;
    case "sports_scores":
      return resolved.favoriteTeam
        ? `Sports schedule for ${resolved.favoriteTeam}`
        : label;
    case "market_brief":
      return resolved.marketSymbols?.length
        ? `Market brief: ${formatMarketSymbols(resolved.marketSymbols)}`
        : label;
    case "horoscope":
      return resolved.zodiacSign
        ? `Horoscope for ${resolved.zodiacSign}`
        : label;
    default:
      return `${label} — generated fresh each call`;
  }
}
