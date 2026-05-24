import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getOrCreateUserWithProfile } from "@/lib/users";
import {
  CITY_WEATHER_NOT_FOUND_ERROR,
  resolveCityForWeather,
} from "@/lib/weather";

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
}) {
  return {
    id: user.id,
    displayName: user.displayName,
    phoneE164: user.phoneE164,
    phoneVerifiedAt: user.phoneVerifiedAt,
    timezone: user.timezone,
    city: user.city,
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

export async function PATCH(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = (await request.json()) as { city?: string };
  const city = body.city?.trim();

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

  await getOrCreateUserWithProfile(authResult.userId);

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ city, updatedAt: new Date() })
    .where(eq(users.id, authResult.userId))
    .returning();

  if (!updated) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  return Response.json({
    user: {
      ...serializeUser(updated),
      cityResolvedLabel: resolved.cityLabel,
    },
  });
}
