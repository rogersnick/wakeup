import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, wakeups } from "@/lib/db/schema";
import { generateWakeUpAudio } from "@/lib/elevenlabs";
import { storeWakeUpAudio } from "@/lib/blob";
import {
  computeFirstAttemptAt,
  type RecurrenceRule,
} from "@/lib/wakeup/recurrence";

const MAX_SCRIPT_LENGTH = 500;
const MAX_TONE_HINT_LENGTH = 100;

export type ScheduleWakeupInput = {
  userId: string;
  type: "one_shot" | "recurring";
  scheduledTimeLocal: string;
  scheduledDate?: string | null;
  recurrence?: RecurrenceRule | null;
  scriptText: string;
  scriptMode?: "static" | "dynamic";
  voiceId?: string;
  timezone?: string;
  maxAttempts?: number;
  retryIntervalMinutes?: number;
};

export async function getOrCreateUser(userId: string, timezone?: string) {
  const db = getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: userId,
      timezone: timezone ?? "America/Toronto",
    })
    .returning();

  return created;
}

export async function assertPhoneVerified(userId: string) {
  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user?.phoneVerifiedAt || !user.phoneE164) {
    throw new Error("Verify your phone number before scheduling a wake-up.");
  }

  return user;
}

export async function scheduleWakeup(input: ScheduleWakeupInput) {
  const scriptMode = input.scriptMode ?? "static";
  const toneHint = input.scriptText.trim();

  if (scriptMode === "static") {
    if (toneHint.length === 0) {
      throw new Error("Wake-up message cannot be empty.");
    }
    if (toneHint.length > MAX_SCRIPT_LENGTH) {
      throw new Error(
        `Wake-up message must be ${MAX_SCRIPT_LENGTH} characters or fewer.`,
      );
    }
  } else if (toneHint.length > MAX_TONE_HINT_LENGTH) {
    throw new Error(
      `Tone hint must be ${MAX_TONE_HINT_LENGTH} characters or fewer.`,
    );
  }

  const user = await assertPhoneVerified(input.userId);
  if (scriptMode === "dynamic" && !user.city?.trim()) {
    throw new Error("Set your city on your profile before scheduling a surprise wake-up.");
  }

  const timezone = input.timezone ?? user.timezone;
  const voiceId =
    input.voiceId ?? process.env.ELEVENLABS_DEFAULT_VOICE_ID ?? "";

  if (!voiceId) {
    throw new Error("ELEVENLABS_DEFAULT_VOICE_ID is not set");
  }

  const nextAttemptAt = computeFirstAttemptAt({
    type: input.type,
    scheduledTimeLocal: input.scheduledTimeLocal,
    scheduledDate: input.scheduledDate,
    recurrence: input.recurrence,
    timezone,
  });

  const db = getDb();
  const wakeupId = crypto.randomUUID();

  let audioBlobUrl: string | null = null;
  if (scriptMode === "static") {
    const audio = await generateWakeUpAudio(toneHint, voiceId);
    audioBlobUrl = await storeWakeUpAudio(wakeupId, audio);
  }

  const [wakeup] = await db
    .insert(wakeups)
    .values({
      id: wakeupId,
      userId: input.userId,
      type: input.type,
      scheduledTimeLocal: input.scheduledTimeLocal,
      scheduledDate: input.scheduledDate ?? null,
      recurrence: input.recurrence ?? null,
      scriptText: toneHint,
      scriptMode,
      resolvedScriptText: null,
      voiceId,
      audioBlobUrl,
      status: "scheduled",
      nextAttemptAt,
      attemptCount: 0,
      maxAttempts: input.maxAttempts ?? 3,
      retryIntervalMinutes: input.retryIntervalMinutes ?? 5,
    })
    .returning();

  if (timezone !== user.timezone) {
    await db
      .update(users)
      .set({ timezone, updatedAt: new Date() })
      .where(eq(users.id, input.userId));
  }

  return wakeup;
}
