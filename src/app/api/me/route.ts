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
    },
  });
}
