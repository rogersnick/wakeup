import { createHash, randomInt } from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000;

export function generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  throw new Error("Enter a valid phone number with country code.");
}
