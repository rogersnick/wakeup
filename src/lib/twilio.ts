import twilio from "twilio";
import { getAppUrl, requireEnv } from "@/lib/env";

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

export function buildWakeUpTwiml(audioBlobUrl: string, wakeupId: string) {
  const response = new twilio.twiml.VoiceResponse();
  // Nest Play inside Gather so DTMF is listened for during audio (press 1 to interrupt).
  const gather = response.gather({
    numDigits: 1,
    action: `/api/twilio/voice/confirm?wakeupId=${wakeupId}`,
    method: "POST",
    timeout: 10,
  });
  gather.play(audioBlobUrl);
  gather.say("Press 1 when you are awake.");
  response.say("We did not receive confirmation. Goodbye.");
  return response.toString();
}
