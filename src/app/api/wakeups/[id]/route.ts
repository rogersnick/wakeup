import { and, eq } from "drizzle-orm";
import { jsonError, requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { wakeups } from "@/lib/db/schema";
import { cleanupWakeUpAudio } from "@/lib/wakeup/audio-cleanup";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await context.params;
  const db = getDb();

  const [updated] = await db
    .update(wakeups)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(wakeups.id, id), eq(wakeups.userId, authResult.userId)))
    .returning();

  if (!updated) {
    return jsonError("Wake-up not found.", 404);
  }

  await cleanupWakeUpAudio(updated.id, updated.audioBlobUrl);

  return Response.json({ wakeup: updated });
}
