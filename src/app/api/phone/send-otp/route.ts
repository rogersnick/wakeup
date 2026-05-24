import { and, desc, eq, gt, isNotNull, ne } from "drizzle-orm";
import { jsonError, requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { phoneOtps, users } from "@/lib/db/schema";
import {
  generateOtpCode,
  getOtpExpiry,
  hashOtpCode,
  normalizePhoneE164,
} from "@/lib/otp";
import { sendOtpSms } from "@/lib/twilio";
import { getOrCreateUser } from "@/lib/wakeup/schedule";

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as { phone?: string; timezone?: string };
    if (!body.phone) {
      return jsonError("Phone number is required.");
    }

    const phoneE164 = normalizePhoneE164(body.phone);
    await getOrCreateUser(authResult.userId, body.timezone);

    const db = getDb();

    const phoneTaken = await db.query.users.findFirst({
      where: and(
        eq(users.phoneE164, phoneE164),
        ne(users.id, authResult.userId),
        isNotNull(users.phoneVerifiedAt),
      ),
    });

    if (phoneTaken) {
      return jsonError("This phone number is already linked to another account.");
    }

    const recent = await db.query.phoneOtps.findFirst({
      where: and(
        eq(phoneOtps.userId, authResult.userId),
        gt(phoneOtps.createdAt, new Date(Date.now() - 60_000)),
      ),
      orderBy: [desc(phoneOtps.createdAt)],
    });

    if (recent) {
      return jsonError("Wait a minute before requesting another code.", 429);
    }

    const code = generateOtpCode();
    await db.insert(phoneOtps).values({
      userId: authResult.userId,
      phoneE164,
      codeHash: hashOtpCode(code),
      expiresAt: getOtpExpiry(),
    });

    await sendOtpSms(phoneE164, code);

    return Response.json({ ok: true, phoneE164 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send verification code.";
    return jsonError(message, 500);
  }
}
