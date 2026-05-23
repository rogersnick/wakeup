"use client";

import { useCallback, useEffect, useState } from "react";
import { PhoneVerification } from "@/components/phone-verification";
import { ScheduleForm } from "@/components/schedule-form";
import { WakeupList } from "@/components/wakeup-list";

type MeResponse = {
  user: {
    phoneE164: string | null;
    phoneVerifiedAt: string | null;
    timezone: string;
  };
};

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMe = useCallback(async () => {
    const response = await fetch("/api/me");
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as MeResponse;
    setMe(data.user);
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe, refreshKey]);

  const phoneVerified = Boolean(me?.phoneVerifiedAt && me.phoneE164);

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-stone-600">
          Verify your phone, schedule a wake-up, and watch the cron dial you.
        </p>
      </div>

      <PhoneVerification
        verifiedPhone={me?.phoneE164}
        onVerified={() => setRefreshKey((value) => value + 1)}
      />

      <ScheduleForm
        disabled={!phoneVerified}
        onCreated={() => setRefreshKey((value) => value + 1)}
      />

      <WakeupList key={refreshKey} />
    </main>
  );
}
