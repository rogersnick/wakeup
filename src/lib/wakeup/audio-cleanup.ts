import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { wakeups, type Wakeup } from "@/lib/db/schema";

export async function deleteWakeUpAudio(audioBlobUrl: string) {
  if (!audioBlobUrl) {
    return;
  }

  await del(audioBlobUrl);
}

export async function deleteChallengeIntroAudio(challengeAudioBlobUrl: string) {
  if (!challengeAudioBlobUrl) {
    return;
  }

  await del(challengeAudioBlobUrl);
}

function shouldCleanupAudio(wakeup: Wakeup): boolean {
  if (wakeup.status === "calling") {
    return false;
  }

  if (wakeup.status === "cancelled") {
    return true;
  }

  if (wakeup.type === "one_shot") {
    return wakeup.status === "confirmed" || wakeup.status === "exhausted";
  }

  return false;
}

export async function cleanupWakeUpAudio(
  wakeupId: string,
  audioBlobUrl: string | null,
  challengeAudioBlobUrl?: string | null,
) {
  if (audioBlobUrl) {
    try {
      await deleteWakeUpAudio(audioBlobUrl);
    } catch (error) {
      console.error(`Failed to delete blob for wake-up ${wakeupId}`, error);
    }
  }

  if (challengeAudioBlobUrl) {
    try {
      await deleteChallengeIntroAudio(challengeAudioBlobUrl);
    } catch (error) {
      console.error(
        `Failed to delete challenge intro blob for wake-up ${wakeupId}`,
        error,
      );
    }
  }

  const db = getDb();
  await db
    .update(wakeups)
    .set({
      audioBlobUrl: null,
      challengeAudioBlobUrl: null,
      updatedAt: new Date(),
    })
    .where(eq(wakeups.id, wakeupId));
}

export async function maybeCleanupWakeUpAudio(wakeupId: string) {
  const db = getDb();
  const wakeup = await db.query.wakeups.findFirst({
    where: eq(wakeups.id, wakeupId),
  });

  if (!wakeup?.audioBlobUrl || !shouldCleanupAudio(wakeup)) {
    return;
  }

  await cleanupWakeUpAudio(
    wakeup.id,
    wakeup.audioBlobUrl,
    wakeup.challengeAudioBlobUrl,
  );
}
