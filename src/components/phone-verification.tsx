"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { dispatchProfileUpdated } from "@/lib/profile-events";

type Props = {
  verifiedPhone?: string | null;
  onVerified: () => void;
};

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
      setMessage(`Code sent to ${data.phoneE164}`);
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
    <Card className="p-8">
      <CardTitle>Verify your phone</CardTitle>
      <CardDescription>
        Required before scheduling. Use E.164 format like +14165551234.
      </CardDescription>

      <div className="mt-6 grid gap-4">
        <Input
          placeholder="+14165551234"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Button
          type="button"
          disabled={loading || phone.trim().length === 0}
          onClick={sendCode}
        >
          Send code
        </Button>

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
