import { jsonError, requireUserId } from "@/lib/api";
import { listWakeUpVoices } from "@/lib/elevenlabs";

export async function GET() {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const voices = await listWakeUpVoices();
    return Response.json({ voices });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load voices.";
    return jsonError(message, 500);
  }
}
