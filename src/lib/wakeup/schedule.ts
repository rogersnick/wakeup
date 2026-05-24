import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, wakeups } from "@/lib/db/schema";
import { generateWakeUpAudio } from "@/lib/elevenlabs";
import { storeWakeUpAudio } from "@/lib/blob";
import {
  computeFirstAttemptAt,
  type RecurrenceRule,
} from "@/lib/wakeup/recurrence";
import type { WakeupScriptMode, WakeupScriptModeInput } from "@/lib/wakeup/modes";
import { isGeneratedMode } from "@/lib/wakeup/modes";
import { normalizeChallengeType } from "@/lib/wakeup/challenge";
import {
  sanitizeContentConfig,
  userToProfileContext,
  validateScheduleMessage,
} from "@/lib/wakeup/validate-message";
import type { WakeupContentConfig } from "@/lib/wakeup/modes";

const MAX_SCRIPT_LENGTH = 500;

export type ScheduleWakeupInput = {
  userId: string;
  type: "one_shot" | "recurring";
  scheduledTimeLocal: string;
  scheduledDate?: string | null;
  recurrence?: RecurrenceRule | null;
  scriptText: string;
  scriptMode?: WakeupScriptModeInput;
  contentConfig?: WakeupContentConfig | null;
  voiceId?: string;
  timezone?: string;
  maxAttempts?: number;
  retryIntervalMinutes?: number;
  challengeEnabled?: boolean;
  challengeType?: string | null;
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
  const user = await assertPhoneVerified(input.userId);
  const profile = userToProfileContext(user);
  const scriptMode = await validateScheduleMessage(
    input.scriptMode,
    profile,
    input.contentConfig,
  );
  const scriptText = input.scriptText.trim();
  const contentConfig = sanitizeContentConfig(
    scriptMode,
    profile,
    input.contentConfig,
  );

  if (!isGeneratedMode(scriptMode)) {
    if (scriptText.length === 0) {
      throw new Error("Wake-up message cannot be empty.");
    }
    if (scriptText.length > MAX_SCRIPT_LENGTH) {
      throw new Error(
        `Wake-up message must be ${MAX_SCRIPT_LENGTH} characters or fewer.`,
      );
    }
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
  if (!isGeneratedMode(scriptMode)) {
    const audio = await generateWakeUpAudio(scriptText, voiceId);
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
      scriptText: isGeneratedMode(scriptMode) ? "" : scriptText,
      scriptMode: scriptMode as WakeupScriptMode,
      contentConfig,
      resolvedScriptText: null,
      voiceId,
      audioBlobUrl,
      status: "scheduled",
      nextAttemptAt,
      attemptCount: 0,
      maxAttempts: input.maxAttempts ?? 3,
      retryIntervalMinutes: input.retryIntervalMinutes ?? 5,
      challengeEnabled: input.challengeEnabled ?? false,
      challengeType: input.challengeEnabled
        ? normalizeChallengeType(input.challengeType)
        : null,
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
