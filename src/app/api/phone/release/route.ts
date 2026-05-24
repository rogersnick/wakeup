import { and, eq } from "drizzle-orm";
import { jsonError, requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { phoneOtps, users } from "@/lib/db/schema";

export async function POST() {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const db = getDb();
    const user = await db.query.users.findFirst({
      where: eq(users.id, authResult.userId),
    });

    if (!user?.phoneE164 || !user.phoneVerifiedAt) {
      return jsonError("No verified phone number to release.");
    }

    const now = new Date();
    await db
      .update(users)
      .set({
        phoneE164: null,
        phoneVerifiedAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, authResult.userId));

    await db
      .delete(phoneOtps)
      .where(and(eq(phoneOtps.userId, authResult.userId)));

    return Response.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to release phone number.";
    return jsonError(message, 500);
  }
}
