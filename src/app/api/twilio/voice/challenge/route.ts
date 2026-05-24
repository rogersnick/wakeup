import { and, eq } from "drizzle-orm";
import { getAppUrl } from "@/lib/env";
import { getDb } from "@/lib/db";
import { wakeupAttempts, wakeups } from "@/lib/db/schema";
import {
  buildChallengeRetryTwiml,
  buildChallengeSuccessTwiml,
  buildChallengeTwiml,
  SNOOZE_DIGIT,
  validateTwilioRequest,
} from "@/lib/twilio";
import {
  challengeRetryPrompt,
  generateChallenge,
  isChallengeAnswerCorrect,
  normalizeChallengeType,
  type ChallengePayload,
} from "@/lib/wakeup/challenge";
import {
  markWakeUpAttemptFailed,
  markWakeUpConfirmed,
  snoozeWakeUp,
} from "@/lib/wakeup/cron";

import {
  attachChallengePromptAudio,
} from "@/lib/wakeup/prepare-challenge";

function formDataToRecord(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

const SILENT_HANGUP_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>';

async function ensureChallengePromptAudio(
  wakeupId: string,
  voiceId: string,
  challenge: ChallengePayload,
) {
  if (challenge.promptAudioUrl) {
    return challenge;
  }

  return attachChallengePromptAudio({
    wakeupId,
    voiceId,
    challenge,
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wakeupId = url.searchParams.get("wakeupId");
  const isRetry = url.searchParams.get("retry") === "1";
  const timedOut = url.searchParams.get("timeout") === "1";

  if (!wakeupId) {
    return new Response("Missing wakeupId", { status: 400 });
  }

  const formData = await request.formData();
  const params = formDataToRecord(formData);
  const signature = request.headers.get("x-twilio-signature");
  const appUrl = getAppUrl().startsWith("http")
    ? getAppUrl()
    : `https://${getAppUrl()}`;
  const validationUrl = `${appUrl}${url.pathname}${url.search}`;

  if (
    process.env.NODE_ENV === "production" &&
    !validateTwilioRequest(validationUrl, params, signature)
  ) {
    return new Response("Invalid Twilio signature", { status: 403 });
  }

  const db = getDb();
  const wakeup = await db.query.wakeups.findFirst({
    where: eq(wakeups.id, wakeupId),
  });

  if (!wakeup) {
    return new Response("Wake-up not found", { status: 404 });
  }

  if (!wakeup.challengeEnabled) {
    return new Response(SILENT_HANGUP_TWIML, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const digits = params.Digits;
  const callSid = params.CallSid;
  let challengeState = wakeup.challengeState;

  if (!challengeState) {
    challengeState = generateChallenge({
      type: normalizeChallengeType(wakeup.challengeType),
      scriptText: wakeup.resolvedScriptText ?? wakeup.scriptText,
    });
  }

  challengeState = await ensureChallengePromptAudio(
    wakeupId,
    wakeup.voiceId,
    challengeState,
  );

  if (!wakeup.audioBlobUrl) {
    await markWakeUpAttemptFailed(wakeupId, "missing_audio");
    return new Response(SILENT_HANGUP_TWIML, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  await db
    .update(wakeups)
    .set({
      challengeState,
      challengeAudioBlobUrl: challengeState.promptAudioUrl,
      updatedAt: new Date(),
    })
    .where(eq(wakeups.id, wakeupId));

  if (!digits && !timedOut && !isRetry) {
    const twiml = buildChallengeTwiml({
      wakeupId,
      wakeupAudioBlobUrl: wakeup.audioBlobUrl,
      prompt: challengeState.prompt,
      promptAudioUrl: challengeState.promptAudioUrl,
    });

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (!digits || timedOut) {
    if (challengeState.attempts >= 1) {
      await markWakeUpAttemptFailed(wakeupId, "challenge_failed");
      return new Response(SILENT_HANGUP_TWIML, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const retryChallenge = await ensureChallengePromptAudio(
      wakeupId,
      wakeup.voiceId,
      {
        ...generateChallenge({
          type: challengeState.type,
          scriptText: wakeup.resolvedScriptText ?? wakeup.scriptText,
        }),
        attempts: 1,
      },
    );

    await db
      .update(wakeups)
      .set({
        challengeState: retryChallenge,
        challengeAudioBlobUrl: retryChallenge.promptAudioUrl,
        updatedAt: new Date(),
      })
      .where(eq(wakeups.id, wakeupId));

    const twiml = buildChallengeRetryTwiml({
      wakeupId,
      wakeupAudioBlobUrl: wakeup.audioBlobUrl,
      retryIntro: challengeRetryPrompt(challengeState.type),
      prompt: retryChallenge.prompt,
      promptAudioUrl: retryChallenge.promptAudioUrl,
    });

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (isChallengeAnswerCorrect(challengeState, digits)) {
    if (callSid) {
      await db
        .update(wakeupAttempts)
        .set({ gatherResult: "1" })
        .where(
          and(
            eq(wakeupAttempts.wakeupId, wakeupId),
            eq(wakeupAttempts.callSid, callSid),
          ),
        );
    }

    await markWakeUpConfirmed(wakeupId);

    const twiml = buildChallengeSuccessTwiml();
    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (digits === SNOOZE_DIGIT) {
    if (callSid) {
      await db
        .update(wakeupAttempts)
        .set({ gatherResult: SNOOZE_DIGIT })
        .where(
          and(
            eq(wakeupAttempts.wakeupId, wakeupId),
            eq(wakeupAttempts.callSid, callSid),
          ),
        );
    }

    const snoozed = await snoozeWakeUp(wakeupId);
    if (snoozed) {
      return new Response(SILENT_HANGUP_TWIML, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    return new Response(SILENT_HANGUP_TWIML, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (challengeState.attempts >= 1 || isRetry) {
    await markWakeUpAttemptFailed(wakeupId, "challenge_failed");
    return new Response(SILENT_HANGUP_TWIML, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  const retryChallenge = await ensureChallengePromptAudio(
    wakeupId,
    wakeup.voiceId,
    {
      ...generateChallenge({
        type: challengeState.type,
        scriptText: wakeup.resolvedScriptText ?? wakeup.scriptText,
      }),
      attempts: 1,
    },
  );

  await db
    .update(wakeups)
    .set({
      challengeState: retryChallenge,
      challengeAudioBlobUrl: retryChallenge.promptAudioUrl,
      updatedAt: new Date(),
    })
    .where(eq(wakeups.id, wakeupId));

  const twiml = buildChallengeRetryTwiml({
    wakeupId,
    wakeupAudioBlobUrl: wakeup.audioBlobUrl,
    retryIntro: challengeRetryPrompt(challengeState.type),
    prompt: retryChallenge.prompt,
    promptAudioUrl: retryChallenge.promptAudioUrl,
  });

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
