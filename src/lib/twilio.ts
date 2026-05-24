import twilio from "twilio";
import { getAppUrl, requireEnv } from "@/lib/env";

export const SNOOZE_DIGIT = "9";
export const CONFIRM_DIGIT = "1";

export function getTwilioClient() {
  return twilio(
    requireEnv("TWILIO_ACCOUNT_SID"),
    requireEnv("TWILIO_AUTH_TOKEN"),
  );
}

export function getTwilioPhoneNumber() {
  return requireEnv("TWILIO_PHONE_NUMBER");
}

export function validateTwilioRequest(
  url: string,
  params: Record<string, string>,
  signature: string | null,
) {
  if (!signature) {
    return false;
  }

  return twilio.validateRequest(
    requireEnv("TWILIO_AUTH_TOKEN"),
    signature,
    url,
    params,
  );
}

export async function sendOtpSms(to: string, code: string) {
  const client = getTwilioClient();
  await client.messages.create({
    to,
    from: getTwilioPhoneNumber(),
    body: `Your Wake Up Call verification code is ${code}. It expires in 10 minutes.`,
  });
}

export async function initiateWakeUpCall(input: {
  wakeupId: string;
  to: string;
}) {
  const client = getTwilioClient();
  const appUrl = getAppUrl().startsWith("http")
    ? getAppUrl()
    : `https://${getAppUrl()}`;

  const call = await client.calls.create({
    to: input.to,
    from: getTwilioPhoneNumber(),
    url: `${appUrl}/api/twilio/voice/wakeup?wakeupId=${input.wakeupId}`,
    statusCallback: `${appUrl}/api/twilio/voice/status?wakeupId=${input.wakeupId}`,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    method: "POST",
  });

  return call.sid;
}

export async function sendWakeUpRecapSms(to: string, scriptText: string) {
  const client = getTwilioClient();
  const recap =
    scriptText.length > 320 ? `${scriptText.slice(0, 317)}...` : scriptText;

  await client.messages.create({
    to,
    from: getTwilioPhoneNumber(),
    body: `You're awake. Here is your wake-up recap:\n\n${recap}`,
  });
}

export function buildWakeUpTwiml(
  audioBlobUrl: string,
  wakeupId: string,
  options?: {
    challengeEnabled?: boolean;
    challengePrompt?: string | null;
    challengePromptAudioUrl?: string | null;
  },
) {
  const appUrl = getAppUrl().startsWith("http")
    ? getAppUrl()
    : `https://${getAppUrl()}`;
  const response = new twilio.twiml.VoiceResponse();

  if (options?.challengeEnabled) {
    const gather = response.gather({
      numDigits: 1,
      action: `${appUrl}/api/twilio/voice/challenge?wakeupId=${wakeupId}`,
      method: "POST",
      timeout: 10,
    });

    if (options.challengePromptAudioUrl) {
      gather.play(options.challengePromptAudioUrl);
    } else if (options.challengePrompt) {
      gather.say({ voice: "Polly.Joanna" }, options.challengePrompt);
    }

    for (let playCount = 0; playCount < 3; playCount += 1) {
      gather.play(audioBlobUrl);
    }

    response.redirect(
      `${appUrl}/api/twilio/voice/challenge?wakeupId=${wakeupId}&timeout=1`,
    );
    return response.toString();
  }

  // Nest Play inside Gather so DTMF is listened for while the wake-up audio loops.
  const gather = response.gather({
    numDigits: 1,
    action: `${appUrl}/api/twilio/voice/confirm?wakeupId=${wakeupId}`,
    method: "POST",
    timeout: 10,
  });

  for (let playCount = 0; playCount < 3; playCount += 1) {
    gather.play(audioBlobUrl);
  }

  response.hangup();
  return response.toString();
}

export function buildChallengeTwiml(input: {
  wakeupId: string;
  wakeupAudioBlobUrl: string;
  prompt: string;
  promptAudioUrl?: string | null;
  retryIntro?: string;
  isRetry?: boolean;
}) {
  const appUrl = getAppUrl().startsWith("http")
    ? getAppUrl()
    : `https://${getAppUrl()}`;
  const response = new twilio.twiml.VoiceResponse();
  const gather = response.gather({
    numDigits: 1,
    action: `${appUrl}/api/twilio/voice/challenge?wakeupId=${input.wakeupId}${input.isRetry ? "&retry=1" : ""}`,
    method: "POST",
    timeout: 10,
  });

  if (input.retryIntro) {
    gather.say({ voice: "Polly.Joanna" }, input.retryIntro);
  }

  if (input.promptAudioUrl) {
    gather.play(input.promptAudioUrl);
  } else {
    gather.say({ voice: "Polly.Joanna" }, input.prompt);
  }

  for (let playCount = 0; playCount < 3; playCount += 1) {
    gather.play(input.wakeupAudioBlobUrl);
  }

  response.redirect(
    `${appUrl}/api/twilio/voice/challenge?wakeupId=${input.wakeupId}${input.isRetry ? "&retry=1" : ""}&timeout=1`,
  );

  return response.toString();
}

export function buildChallengeRetryTwiml(input: {
  wakeupId: string;
  wakeupAudioBlobUrl: string;
  retryIntro: string;
  prompt: string;
  promptAudioUrl?: string | null;
}) {
  return buildChallengeTwiml({
    wakeupId: input.wakeupId,
    wakeupAudioBlobUrl: input.wakeupAudioBlobUrl,
    retryIntro: input.retryIntro,
    prompt: input.prompt,
    promptAudioUrl: input.promptAudioUrl,
    isRetry: true,
  });
}

export function buildChallengeSuccessTwiml() {
  const response = new twilio.twiml.VoiceResponse();
  response.say(
    { voice: "Polly.Joanna" },
    "Nice work... you are awake. Have a great day.",
  );
  response.hangup();
  return response.toString();
}
