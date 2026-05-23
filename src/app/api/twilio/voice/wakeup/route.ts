import { eq } from "drizzle-orm";
import { getAppUrl } from "@/lib/env";
import { getDb } from "@/lib/db";
import { wakeups } from "@/lib/db/schema";
import { buildWakeUpTwiml, validateTwilioRequest } from "@/lib/twilio";

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

  const db = getDb();
  const wakeup = await db.query.wakeups.findFirst({
    where: eq(wakeups.id, wakeupId),
  });

  if (!wakeup) {
    return new Response("Wake-up not found", { status: 404 });
  }

  const twiml = buildWakeUpTwiml(wakeup.audioBlobUrl, wakeup.id);
  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
