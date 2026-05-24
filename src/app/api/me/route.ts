import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET() {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  const db = getDb();
  let user = await db.query.users.findFirst({
    where: eq(users.id, authResult.userId),
  });

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ id: authResult.userId })
      .returning();
    user = created;
  }

  return Response.json({
    user: {
      id: user.id,
      phoneE164: user.phoneE164,
      phoneVerifiedAt: user.phoneVerifiedAt,
      timezone: user.timezone,
      city: user.city,
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

  const db = getDb();
  const [updated] = await db
    .update(users)
    .set({ city, updatedAt: new Date() })
    .where(eq(users.id, authResult.userId))
    .returning();

  if (!updated) {
    const [created] = await db
      .insert(users)
      .values({ id: authResult.userId, city })
      .returning();

    return Response.json({
      user: {
        id: created.id,
        phoneE164: created.phoneE164,
        phoneVerifiedAt: created.phoneVerifiedAt,
        timezone: created.timezone,
        city: created.city,
      },
    });
  }

  return Response.json({
    user: {
      id: updated.id,
      phoneE164: updated.phoneE164,
      phoneVerifiedAt: updated.phoneVerifiedAt,
      timezone: updated.timezone,
      city: updated.city,
    },
  });
}
