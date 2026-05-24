"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { dispatchProfileUpdated } from "@/lib/profile-events";

type Props = {
  verifiedPhone?: string | null;
  onVerified: () => void;
};

function formatPhoneDisplay(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function friendlyE164(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const local = digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length !== 10) return e164;
  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

export function PhoneVerification({ verifiedPhone, onVerified }: Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch("/api/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, timezone }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send code");
      }
      setSentTo(data.phoneE164);
      setMessage(`Code sent to ${friendlyE164(data.phoneE164)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to verify code");
      }
      setMessage("Phone verified.");
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setLoading(false);
    }
  }

  if (verifiedPhone) {
    return null;
  }

  return (
    <Card className="p-8" variant="primary">
      <CardEyebrow>Step 1</CardEyebrow>
      <CardTitle className="mt-2 text-2xl">Verify your phone</CardTitle>
      <CardDescription>
        Enter your US mobile number and we'll text you a code.
      </CardDescription>

      <div className="mt-6 grid gap-4">
        <Input
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(event) => setPhone(formatPhoneDisplay(event.target.value))}
          inputMode="tel"
          autoComplete="tel"
        />
        {!sentTo ? (
          <Button
            type="button"
            disabled={loading || phone.replace(/\D/g, "").length < 10}
            onClick={sendCode}
            className="hover:border-white hover:bg-white hover:text-[#ff6a00]"
          >
            Send code
          </Button>
        ) : null}

        {sentTo ? (
          <>
            <Input
              placeholder="6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={loading || code.trim().length === 0}
              onClick={verifyCode}
            >
              Verify code
            </Button>
          </>
        ) : null}
      </div>

      {message ? <Alert variant="success" className="mt-4">{message}</Alert> : null}
      {error ? <Alert variant="error" className="mt-4">{error}</Alert> : null}
    </Card>
  );
}
