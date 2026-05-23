import { and, eq, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, wakeupAttempts, wakeups } from "@/lib/db/schema";
import { initiateWakeUpCall } from "@/lib/twilio";
import { cleanupWakeUpAudio } from "@/lib/wakeup/audio-cleanup";
import {
  computeNextOccurrence,
  computeRetryAttemptAt,
  type RecurrenceRule,
} from "@/lib/wakeup/recurrence";

export async function processDueWakeups(now = new Date()) {
  const db = getDb();
  const due = await db
    .select()
    .from(wakeups)
    .where(
      and(
        eq(wakeups.status, "scheduled"),
        lte(wakeups.nextAttemptAt, now),
        sql`${wakeups.attemptCount} < ${wakeups.maxAttempts}`,
      ),
    )
    .limit(20);

  const results = [];

  for (const wakeup of due) {
    const result = await startWakeUpAttempt(wakeup.id, now);
    results.push(result);
  }

  return results;
}

async function startWakeUpAttempt(wakeupId: string, now: Date) {
  const db = getDb();
  const [locked] = await db
    .update(wakeups)
    .set({ status: "calling", updatedAt: now })
    .where(and(eq(wakeups.id, wakeupId), eq(wakeups.status, "scheduled")))
    .returning();

  if (!locked) {
    return { wakeupId, started: false };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, locked.userId),
  });

  if (!user?.phoneE164) {
    await db
      .update(wakeups)
      .set({ status: "exhausted", updatedAt: now })
      .where(eq(wakeups.id, wakeupId));
    await cleanupWakeUpAudio(locked.id, locked.audioBlobUrl);
    return { wakeupId, started: false, reason: "missing_phone" };
  }

  const attemptNumber = locked.attemptCount + 1;
  const callSid = await initiateWakeUpCall({
    wakeupId: locked.id,
    to: user.phoneE164,
  });

  await db.insert(wakeupAttempts).values({
    wakeupId: locked.id,
    attemptNumber,
    callSid,
    status: "initiated",
  });

  await db
    .update(wakeups)
    .set({
      lastCallSid: callSid,
      lastCallStatus: "initiated",
      updatedAt: now,
    })
    .where(eq(wakeups.id, wakeupId));

  return { wakeupId, started: true, callSid };
}

export async function markWakeUpConfirmed(wakeupId: string) {
  const db = getDb();
  const now = new Date();
  const wakeup = await db.query.wakeups.findFirst({
    where: eq(wakeups.id, wakeupId),
  });

  if (!wakeup) {
    return null;
  }

  if (wakeup.type === "recurring" && wakeup.recurrence) {
    const nextAttemptAt = computeNextOccurrence({
      scheduledTimeLocal: wakeup.scheduledTimeLocal,
      recurrence: wakeup.recurrence as RecurrenceRule,
      timezone: (
        await db.query.users.findFirst({ where: eq(users.id, wakeup.userId) })
      )?.timezone ?? "America/Toronto",
      after: now,
    });

    const [updated] = await db
      .update(wakeups)
      .set({
        status: "scheduled",
        attemptCount: 0,
        nextAttemptAt,
        lastCallStatus: "confirmed",
        updatedAt: now,
      })
      .where(eq(wakeups.id, wakeupId))
      .returning();

    return updated;
  }

  const [updated] = await db
    .update(wakeups)
    .set({
      status: "confirmed",
      lastCallStatus: "confirmed",
      updatedAt: now,
    })
    .where(eq(wakeups.id, wakeupId))
    .returning();

  await cleanupWakeUpAudio(wakeup.id, wakeup.audioBlobUrl);
  return updated;
}

export async function markWakeUpAttemptFailed(wakeupId: string, reason: string) {
  const db = getDb();
  const now = new Date();
  const wakeup = await db.query.wakeups.findFirst({
    where: eq(wakeups.id, wakeupId),
  });

  if (!wakeup || wakeup.status !== "calling") {
    return null;
  }

  const nextAttemptCount = wakeup.attemptCount + 1;

  if (nextAttemptCount < wakeup.maxAttempts) {
    const [updated] = await db
      .update(wakeups)
      .set({
        status: "scheduled",
        attemptCount: nextAttemptCount,
        nextAttemptAt: computeRetryAttemptAt(now, wakeup.retryIntervalMinutes),
        lastCallStatus: reason,
        updatedAt: now,
      })
      .where(eq(wakeups.id, wakeupId))
      .returning();

    return updated;
  }

  if (wakeup.type === "recurring" && wakeup.recurrence) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, wakeup.userId),
    });
    const nextAttemptAt = computeNextOccurrence({
      scheduledTimeLocal: wakeup.scheduledTimeLocal,
      recurrence: wakeup.recurrence as RecurrenceRule,
      timezone: user?.timezone ?? "America/Toronto",
      after: now,
    });

    const [updated] = await db
      .update(wakeups)
      .set({
        status: "scheduled",
        attemptCount: 0,
        nextAttemptAt,
        lastCallStatus: reason,
        updatedAt: now,
      })
      .where(eq(wakeups.id, wakeupId))
      .returning();

    return updated;
  }

  const [updated] = await db
    .update(wakeups)
    .set({
      status: "exhausted",
      attemptCount: nextAttemptCount,
      lastCallStatus: reason,
      updatedAt: now,
    })
    .where(eq(wakeups.id, wakeupId))
    .returning();

  await cleanupWakeUpAudio(wakeup.id, wakeup.audioBlobUrl);
  return updated;
}

export async function updateAttemptFromStatus(input: {
  wakeupId: string;
  callSid: string;
  callStatus: string;
}) {
  const db = getDb();
  const now = new Date();

  await db
    .update(wakeupAttempts)
    .set({
      status: input.callStatus,
      completedAt: input.callStatus === "completed" ? now : undefined,
    })
    .where(
      and(
        eq(wakeupAttempts.wakeupId, input.wakeupId),
        eq(wakeupAttempts.callSid, input.callSid),
      ),
    );

  await db
    .update(wakeups)
    .set({
      lastCallStatus: input.callStatus,
      updatedAt: now,
    })
    .where(eq(wakeups.id, input.wakeupId));

  if (input.callStatus === "completed") {
    const wakeup = await db.query.wakeups.findFirst({
      where: eq(wakeups.id, input.wakeupId),
    });

    if (wakeup?.status === "calling") {
      await markWakeUpAttemptFailed(input.wakeupId, "no_confirmation");
    }
  }
}
