import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { wakeups } from "@/lib/db/schema";

export async function deleteWakeUpAudio(audioBlobUrl: string) {
  if (!audioBlobUrl) {
    return;
  }

  await del(audioBlobUrl);
}

export async function cleanupWakeUpAudio(wakeupId: string, audioBlobUrl: string) {
  if (!audioBlobUrl) {
    return;
  }

  try {
    await deleteWakeUpAudio(audioBlobUrl);
  } catch (error) {
    console.error(`Failed to delete blob for wake-up ${wakeupId}`, error);
  }

  const db = getDb();
  await db
    .update(wakeups)
    .set({ audioBlobUrl: "", updatedAt: new Date() })
    .where(eq(wakeups.id, wakeupId));
}
