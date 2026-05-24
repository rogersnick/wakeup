import { requireEnv } from "@/lib/env";

export type ElevenLabsVoice = {
  voiceId: string;
  name: string;
  description?: string;
};

type ElevenLabsVoiceResponse = {
  voices?: Array<{
    voice_id?: string;
    name?: string;
    category?: string;
    labels?: Record<string, string>;
    description?: string;
  }>;
};

export async function listWakeUpVoices(): Promise<ElevenLabsVoice[]> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs voices failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as ElevenLabsVoiceResponse;

  return (data.voices ?? []).flatMap((voice) => {
    if (!voice.voice_id || !voice.name) {
      return [];
    }

    return [
      {
        voiceId: voice.voice_id,
        name: voice.name,
        description:
          voice.description ??
          voice.labels?.description ??
          voice.labels?.accent ??
          voice.category,
      },
    ];
  });
}

export async function generateWakeUpAudio(
  scriptText: string,
  voiceId?: string,
): Promise<Buffer> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY");
  const resolvedVoiceId = voiceId ?? requireEnv("ELEVENLABS_DEFAULT_VOICE_ID");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: scriptText,
        model_id:
          process.env.ELEVENLABS_MODEL_ID ?? "eleven_flash_v2_5",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs failed: ${response.status} ${body}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
