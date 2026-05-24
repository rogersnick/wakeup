export function normalizePhoneE164(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  throw new Error("Enter a valid 10-digit US phone number.");
}

export function isValidPhoneE164(phone: string): boolean {
  try {
    normalizePhoneE164(phone);
    return true;
  } catch {
    return false;
  }
}
