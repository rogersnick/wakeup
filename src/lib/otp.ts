import { createHash, randomInt } from "crypto";
import { normalizePhoneE164 } from "@/lib/phone";

export { normalizePhoneE164 };

export function generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

const OTP_TTL_MS = 10 * 60 * 1000;
