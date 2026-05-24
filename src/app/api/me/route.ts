import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOrCreateUserWithProfile } from "@/lib/users";
import {
  CITY_WEATHER_NOT_FOUND_ERROR,
  resolveCityForWeather,
} from "@/lib/weather";
import {
  formatMarketSymbols,
  isZodiacSign,
  parseMarketSymbols,
  type ZodiacSign,
} from "@/lib/wakeup/modes";

async function getCityResolvedLabel(city: string | null | undefined) {
  if (!city?.trim()) {
    return null;
  }

  const resolved = await resolveCityForWeather(city);
  return resolved?.cityLabel ?? null;
}

function serializeUser(user: {
  id: string;
  displayName: string | null;
  phoneE164: string | null;
  phoneVerifiedAt: Date | null;
  timezone: string;
  city: string | null;
  favoriteTeam: string | null;
  marketSymbols: string | null;
  zodiacSign: string | null;
}) {
  return {
    id: user.id,
    displayName: user.displayName,
    phoneE164: user.phoneE164,
    phoneVerifiedAt: user.phoneVerifiedAt,
    timezone: user.timezone,
    city: user.city,
    favoriteTeam: user.favoriteTeam,
    marketSymbols: user.marketSymbols,
    zodiacSign: user.zodiacSign,
  };
}

export async function GET() {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  const user = await getOrCreateUserWithProfile(authResult.userId);

  return Response.json({
    user: {
      ...serializeUser(user),
      cityResolvedLabel: await getCityResolvedLabel(user.city),
    },
  });
}

const MAX_CITY_LENGTH = 100;
const MAX_TEAM_LENGTH = 80;
const MAX_SYMBOLS_LENGTH = 80;

type PatchBody = {
  city?: string;
  favoriteTeam?: string;
  marketSymbols?: string | string[];
  zodiacSign?: string;
};

export async function PATCH(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = (await request.json()) as PatchBody;
  const updates: Partial<{
    city: string;
    favoriteTeam: string | null;
    marketSymbols: string | null;
    zodiacSign: ZodiacSign | null;
  }> = {};

  if (body.city !== undefined) {
    const city = body.city.trim();
    if (!city) {
      return Response.json({ error: "city is required." }, { status: 400 });
    }
    if (city.length > MAX_CITY_LENGTH) {
      return Response.json(
        { error: `city must be ${MAX_CITY_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    }

    const resolved = await resolveCityForWeather(city);
    if (!resolved) {
      return Response.json({ error: CITY_WEATHER_NOT_FOUND_ERROR }, { status: 400 });
    }

    updates.city = city;
  }

  if (body.favoriteTeam !== undefined) {
    const favoriteTeam = body.favoriteTeam.trim();
    if (!favoriteTeam) {
      updates.favoriteTeam = null;
    } else if (favoriteTeam.length > MAX_TEAM_LENGTH) {
      return Response.json(
        { error: `favoriteTeam must be ${MAX_TEAM_LENGTH} characters or fewer.` },
        { status: 400 },
      );
    } else {
      updates.favoriteTeam = favoriteTeam;
    }
  }

  if (body.marketSymbols !== undefined) {
    const raw =
      typeof body.marketSymbols === "string"
        ? body.marketSymbols
        : body.marketSymbols.join(",");
    const symbols = parseMarketSymbols(raw);
    if (symbols.length === 0) {
      updates.marketSymbols = null;
    } else {
      const formatted = formatMarketSymbols(symbols);
      if (formatted.length > MAX_SYMBOLS_LENGTH) {
        return Response.json(
          { error: `marketSymbols must be ${MAX_SYMBOLS_LENGTH} characters or fewer.` },
          { status: 400 },
        );
      }
      updates.marketSymbols = formatted;
    }
  }

  if (body.zodiacSign !== undefined) {
    const sign = body.zodiacSign.trim().toLowerCase();
    if (!sign) {
      updates.zodiacSign = null;
    } else if (!isZodiacSign(sign)) {
      return Response.json({ error: "Invalid zodiac sign." }, { status: 400 });
    } else {
      updates.zodiacSign = sign;
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No profile fields provided." }, { status: 400 });
  }

  await getOrCreateUserWithProfile(authResult.userId);

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, authResult.userId))
    .returning();

  if (!updated) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const cityResolvedLabel = await getCityResolvedLabel(updated.city);

  return Response.json({
    user: {
      ...serializeUser(updated),
      cityResolvedLabel,
    },
  });
}
