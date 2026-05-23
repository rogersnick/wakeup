import { desc, eq } from "drizzle-orm";
import { jsonError, requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { wakeups } from "@/lib/db/schema";
import { getOrCreateUser, scheduleWakeup } from "@/lib/wakeup/schedule";

export async function GET() {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  const db = getDb();
  const rows = await db.query.wakeups.findMany({
    where: eq(wakeups.userId, authResult.userId),
    orderBy: [desc(wakeups.createdAt)],
  });

  return Response.json({ wakeups: rows });
}

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as {
      type?: "one_shot" | "recurring";
      scheduledTimeLocal?: string;
      scheduledDate?: string | null;
      recurrence?: { days: number[] } | null;
      scriptText?: string;
      voiceId?: string;
      timezone?: string;
    };

    if (!body.type || !body.scheduledTimeLocal || !body.scriptText) {
      return jsonError("type, scheduledTimeLocal, and scriptText are required.");
    }

    await getOrCreateUser(authResult.userId, body.timezone);
    const wakeup = await scheduleWakeup({
      userId: authResult.userId,
      type: body.type,
      scheduledTimeLocal: body.scheduledTimeLocal,
      scheduledDate: body.scheduledDate,
      recurrence: body.recurrence,
      scriptText: body.scriptText,
      voiceId: body.voiceId,
      timezone: body.timezone,
    });

    return Response.json({ wakeup }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to schedule wake-up.";
    return jsonError(message, 500);
  }
}
