import { and, asc, eq } from "drizzle-orm";
import { jsonError, requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { wakeupAttempts, wakeups } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await context.params;
  const db = getDb();

  const wakeup = await db.query.wakeups.findFirst({
    where: and(eq(wakeups.id, id), eq(wakeups.userId, authResult.userId)),
  });

  if (!wakeup) {
    return jsonError("Wake-up not found.", 404);
  }

  const attempts = await db.query.wakeupAttempts.findMany({
    where: eq(wakeupAttempts.wakeupId, id),
    orderBy: [asc(wakeupAttempts.startedAt)],
  });

  return Response.json({
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      callSid: attempt.callSid,
      status: attempt.status,
      gatherResult: attempt.gatherResult,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    })),
  });
}
