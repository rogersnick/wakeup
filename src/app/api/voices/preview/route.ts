import { jsonError, requireUserId } from "@/lib/api";
import { generateWakeUpAudio } from "@/lib/elevenlabs";

const MAX_PREVIEW_LENGTH = 180;

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as {
      scriptText?: string;
      voiceId?: string;
    };
    const scriptText = body.scriptText?.trim();

    if (!scriptText || !body.voiceId) {
      return jsonError("scriptText and voiceId are required.");
    }

    const audio = await generateWakeUpAudio(
      scriptText.slice(0, MAX_PREVIEW_LENGTH),
      body.voiceId,
    );

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate preview.";
    return jsonError(message, 500);
  }
}
