"use client";

import { CheckCircle2, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HeaderDropdown } from "@/components/ui/header-dropdown";
import {
  dispatchProfileUpdated,
  PROFILE_UPDATED_EVENT,
} from "@/lib/profile-events";

type MeResponse = {
  user: {
    phoneE164: string | null;
    phoneVerifiedAt: string | null;
  };
};

export function HeaderPhoneStatus() {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
        const verified = Boolean(
          data.user.phoneVerifiedAt && data.user.phoneE164,
        );
        setPhone(verified ? data.user.phoneE164 : null);
      }
    }

    void fetchMe();

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

  async function releasePhone(close: () => void) {
    setLoading(true);

    try {
      const response = await fetch("/api/phone/release", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to release phone number");
      }
      setPhone(null);
      close();
      dispatchProfileUpdated();
    } catch {
      // Silent in header — dashboard form surfaces errors when re-verifying.
    } finally {
      setLoading(false);
    }
  }

  if (!phone) {
    return null;
  }

  return (
    <HeaderDropdown
      trigger={(open) => (
        <>
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="hidden max-w-[8rem] truncate md:inline">{phone}</span>
          <span className="md:hidden">Verified</span>
          <ChevronDown
            className={[
              "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </>
      )}
    >
      {(close) => (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Phone verified
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{phone}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={loading}
            onClick={() => void releasePhone(close)}
          >
            Change phone number
          </Button>
        </>
      )}
    </HeaderDropdown>
  );
}
