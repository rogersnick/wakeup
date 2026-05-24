import { getAppUrl } from "@/lib/env";
import { validateTwilioRequest } from "@/lib/twilio";
import { updateAttemptFromStatus } from "@/lib/wakeup/cron";

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

  const callSid = params.CallSid;
  const callStatus = params.CallStatus;

  if (callSid && callStatus) {
    await updateAttemptFromStatus({ wakeupId, callSid, callStatus });
  }

  return new Response(null, { status: 200 });
}
