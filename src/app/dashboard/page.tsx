"use client";

import { useEffect, useState } from "react";
import { PhoneVerification } from "@/components/phone-verification";
import { CityInput } from "@/components/city-input";
import { ScheduleForm } from "@/components/schedule-form";
import { WakeupList } from "@/components/wakeup-list";

type MeResponse = {
  user: {
    phoneE164: string | null;
    phoneVerifiedAt: string | null;
    timezone: string;
    city: string | null;
  };
};

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchMe() {
      const response = await fetch("/api/me");
      if (!response.ok || cancelled) {
        return;
      }
      const data = (await response.json()) as MeResponse;
      if (!cancelled) {
        setMe(data.user);
      }
    }

    void fetchMe();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const phoneVerified = Boolean(me?.phoneVerifiedAt && me.phoneE164);

  return (
    <main className="bg-muted min-h-[calc(100vh-4rem)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Your wake-ups
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-gray-600">
            Confirm your number, choose when we should call, and keep track of
            the mornings you have lined up.
          </p>
        </div>

        <PhoneVerification
          verifiedPhone={me?.phoneE164}
          onVerified={() => setRefreshKey((value) => value + 1)}
        />

        <CityInput
          key={me?.city ?? "unset"}
          city={me?.city}
          onSaved={() => setRefreshKey((value) => value + 1)}
        />

        <ScheduleForm
          disabled={!phoneVerified}
          userCity={me?.city}
          onCreated={() => setRefreshKey((value) => value + 1)}
        />

        <WakeupList refreshKey={refreshKey} />
      </div>
    </main>
  );
}
