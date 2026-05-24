import { and, eq } from "drizzle-orm";
import { getAppUrl } from "@/lib/env";
import { getDb } from "@/lib/db";
import { wakeupAttempts } from "@/lib/db/schema";
import { validateTwilioRequest, SNOOZE_DIGIT, CONFIRM_DIGIT } from "@/lib/twilio";
import {
  markWakeUpAttemptFailed,
  markWakeUpConfirmed,
  snoozeWakeUp,
} from "@/lib/wakeup/cron";

const SILENT_HANGUP_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>';

function formDataToRecord(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = String(value);
  });
  return params;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wakeupId = url.searchParams.get("wakeupId");

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

  const digits = params.Digits;
  const callSid = params.CallSid;

  if (callSid) {
    const db = getDb();
    await db
      .update(wakeupAttempts)
      .set({ gatherResult: digits ?? "none" })
      .where(
        and(
          eq(wakeupAttempts.wakeupId, wakeupId),
          eq(wakeupAttempts.callSid, callSid),
        ),
      );
  }

  if (digits === CONFIRM_DIGIT) {
    await markWakeUpConfirmed(wakeupId);
    return new Response(SILENT_HANGUP_TWIML, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (digits === SNOOZE_DIGIT) {
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

  await markWakeUpAttemptFailed(wakeupId, "wrong_or_missing_digit");

  return new Response(SILENT_HANGUP_TWIML, {
    headers: { "Content-Type": "text/xml" },
  });
}
