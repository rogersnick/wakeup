"use client";

import { useState } from "react";

type Props = {
  verifiedPhone?: string | null;
  onVerified: () => void;
};

export function PhoneVerification({ verifiedPhone, onVerified }: Props) {
  const [phone, setPhone] = useState(verifiedPhone ?? "");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(verifiedPhone ?? null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (verifiedPhone) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-medium text-emerald-900">Phone verified</h2>
        <p className="mt-1 text-sm text-emerald-800">{verifiedPhone}</p>
      </section>
    );
  }

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

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 text-stone-900">
      <h2 className="font-medium">Verify your phone</h2>
      <p className="mt-1 text-sm text-stone-700">
        Required before scheduling. Use E.164 format like +14165551234.
      </p>

      <div className="mt-4 grid gap-3">
        <input
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400"
          placeholder="+14165551234"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <button
          type="button"
          disabled={loading || phone.trim().length === 0}
          onClick={sendCode}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send code
        </button>

        {sentTo ? (
          <>
            <input
              className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400"
              placeholder="6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <button
              type="button"
              disabled={loading || code.trim().length === 0}
              onClick={verifyCode}
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 disabled:opacity-50"
            >
              Verify code
            </button>
          </>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
