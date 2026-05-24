import { put } from "@vercel/blob";
import { generateWakeUpAudio } from "@/lib/elevenlabs";
import {
  buildChallengeIntroScript,
  generateChallenge,
  normalizeChallengeType,
  type ChallengePayload,
} from "@/lib/wakeup/challenge";

export async function storeChallengePromptAudio(
  wakeupId: string,
  audio: Buffer,
): Promise<string> {
  const blob = await put(`wakeups/${wakeupId}-challenge-prompt.mp3`, audio, {
    access: "public",
    contentType: "audio/mpeg",
    addRandomSuffix: false,
  });

  return blob.url;
}

export async function attachChallengePromptAudio(input: {
  wakeupId: string;
  voiceId: string;
  challenge: ChallengePayload;
}): Promise<ChallengePayload> {
  const audio = await generateWakeUpAudio(input.challenge.spokenPrompt, input.voiceId);
  const promptAudioUrl = await storeChallengePromptAudio(input.wakeupId, audio);

  return {
    ...input.challenge,
    promptAudioUrl,
  };
}

export async function prepareChallengeForCall(input: {
  wakeupId: string;
  voiceId: string;
  challengeType: string | null;
  scriptText: string | null | undefined;
}): Promise<{
  challengeState: ChallengePayload;
  challengeAudioBlobUrl: string | null;
  introScriptText: string;
}> {
  const baseChallenge = generateChallenge({
    type: normalizeChallengeType(input.challengeType),
    scriptText: input.scriptText,
  });
  const introScriptText = buildChallengeIntroScript(baseChallenge);
  const challengeState = await attachChallengePromptAudio({
    wakeupId: input.wakeupId,
    voiceId: input.voiceId,
    challenge: baseChallenge,
  });

  return {
    challengeState,
    challengeAudioBlobUrl: challengeState.promptAudioUrl ?? null,
    introScriptText,
  };
}
