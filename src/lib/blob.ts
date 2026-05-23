import { put } from "@vercel/blob";

export async function storeWakeUpAudio(
  wakeupId: string,
  audio: Buffer,
): Promise<string> {
  const blob = await put(`wakeups/${wakeupId}.mp3`, audio, {
    access: "public",
    contentType: "audio/mpeg",
    addRandomSuffix: false,
  });

  return blob.url;
}
