"use client";

import { useEffect, useRef, useState } from "react";
import { NextWakeupPreview } from "@/components/next-wakeup-preview";
import { PhoneVerification } from "@/components/phone-verification";
import { ScheduleForm } from "@/components/schedule-form";
import { WakeupList } from "@/components/wakeup-list";
import { Card } from "@/components/ui/card";
import { PROFILE_UPDATED_EVENT } from "@/lib/profile-events";
import {
  getNextActiveWakeup,
  type WakeupDisplay,
} from "@/lib/wakeup/display";

type MeResponse = {
  user: {
    phoneE164: string | null;
    phoneVerifiedAt: string | null;
    timezone: string;
    city: string | null;
    cityResolvedLabel: string | null;
  };
};

function DashboardLoading() {
  return (
    <Card className="p-8">
      <p className="text-sm font-medium text-muted-foreground">
        Loading your dashboard...
      </p>
    </Card>
  );
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse["user"] | null>(null);
  const [nextWakeup, setNextWakeup] = useState<WakeupDisplay | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }

      try {
        const [meResponse, wakeupsResponse] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/wakeups"),
        ]);

        if (cancelled) {
          return;
        }

        if (meResponse.ok) {
          const meData = (await meResponse.json()) as MeResponse;
          setMe(meData.user);
        }

        if (wakeupsResponse.ok) {
          const wakeupsData = (await wakeupsResponse.json()) as {
            wakeups: WakeupDisplay[];
          };
          setNextWakeup(getNextActiveWakeup(wakeupsData.wakeups) ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          hasLoadedOnce.current = true;
        }
      }
    }

    void fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    function handleProfileUpdated() {
      setRefreshKey((value) => value + 1);
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  const phoneVerified = Boolean(me?.phoneVerifiedAt && me.phoneE164);

  function handleCitySaved() {
    setRefreshKey((value) => value + 1);
  }

  return (
    <main className="bg-muted min-h-[calc(100vh-4rem)]">
      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10">
        <div>
          <p className="font-sans text-xs font-bold uppercase tracking-widest text-primary">
            Dashboard
          </p>
          <h1 className="mt-2 font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Your wake-ups
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {loading
              ? "Loading your wake-up settings..."
              : phoneVerified
                ? "See what's coming up and manage the mornings you have lined up."
                : "Confirm your number, choose when we should call, and keep track of the mornings you have lined up."}
          </p>
        </div>

        {loading ? (
          <DashboardLoading />
        ) : (
          <>
            {!phoneVerified ? (
              <PhoneVerification
                verifiedPhone={me?.phoneE164}
                onVerified={() => setRefreshKey((value) => value + 1)}
              />
            ) : null}

            {nextWakeup ? (
              <NextWakeupPreview
                wakeup={nextWakeup}
                userCity={me?.cityResolvedLabel ?? me?.city}
                city={me?.city}
                cityResolvedLabel={me?.cityResolvedLabel}
                onCitySaved={handleCitySaved}
                timezone={me?.timezone}
              />
            ) : (
              <ScheduleForm
                disabled={!phoneVerified}
                userCity={me?.city}
                cityResolvedLabel={me?.cityResolvedLabel}
                onCreated={() => setRefreshKey((value) => value + 1)}
                onCitySaved={handleCitySaved}
              />
            )}

            <WakeupList refreshKey={refreshKey} />
          </>
        )}
      </div>
    </main>
  );
}
