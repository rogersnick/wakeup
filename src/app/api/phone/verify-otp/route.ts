import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { jsonError, requireUserId } from "@/lib/api";
import { getDb } from "@/lib/db";
import { phoneOtps, users } from "@/lib/db/schema";
import { hashOtpCode } from "@/lib/otp";
import { normalizePhoneE164 } from "@/lib/phone";

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as {
      code?: string;
      phoneE164?: string;
    };
    if (!body.code) {
      return jsonError("Verification code is required.");
    }

    const expectedPhoneE164 = body.phoneE164
      ? normalizePhoneE164(body.phoneE164)
      : null;

    const db = getDb();
    const otp = await db.query.phoneOtps.findFirst({
      where: eq(phoneOtps.userId, authResult.userId),
      orderBy: [desc(phoneOtps.createdAt)],
    });

    if (!otp) {
      return jsonError("No verification code found. Request a new one.");
    }

    if (expectedPhoneE164 && otp.phoneE164 !== expectedPhoneE164) {
      return jsonError("Phone number does not match the verification request.");
    }

    if (otp.expiresAt < new Date()) {
      return jsonError("Verification code expired. Request a new one.");
    }

    if (otp.attempts >= 5) {
      return jsonError("Too many attempts. Request a new code.");
    }

    if (otp.codeHash !== hashOtpCode(body.code)) {
      await db
        .update(phoneOtps)
        .set({ attempts: otp.attempts + 1 })
        .where(eq(phoneOtps.id, otp.id));
      return jsonError("Invalid verification code.");
    }

    const phoneTaken = await db.query.users.findFirst({
      where: and(
        eq(users.phoneE164, otp.phoneE164),
        ne(users.id, authResult.userId),
        isNotNull(users.phoneVerifiedAt),
      ),
    });

    if (phoneTaken) {
      return jsonError("This phone number is already linked to another account.");
    }

    const now = new Date();
    await db
      .update(users)
      .set({
        phoneE164: otp.phoneE164,
        phoneVerifiedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, authResult.userId));

    await db.delete(phoneOtps).where(and(eq(phoneOtps.userId, authResult.userId)));

    return Response.json({ ok: true, phoneE164: otp.phoneE164 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify code.";
    return jsonError(message, 500);
  }
}
