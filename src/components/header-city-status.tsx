"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HeaderDropdown } from "@/components/ui/header-dropdown";
import {
  dispatchCityChangeRequested,
  PROFILE_UPDATED_EVENT,
} from "@/lib/profile-events";

type MeResponse = {
  user: {
    city: string | null;
    cityResolvedLabel: string | null;
  };
};

export function HeaderCityStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const [cityLabel, setCityLabel] = useState<string | null>(null);
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
        setCityLabel(
          data.user.cityResolvedLabel ?? data.user.city?.trim() ?? null,
        );
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

  function changeCity(close: () => void) {
    close();
    dispatchCityChangeRequested();
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  }

  if (!cityLabel) {
    return null;
  }

  return (
    <HeaderDropdown
      trigger={(open) => (
        <>
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="hidden max-w-[9rem] truncate font-mono text-xs font-medium uppercase tracking-widest sm:inline">
            {cityLabel}
          </span>
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
            Wake-up city
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{cityLabel}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => changeCity(close)}
          >
            Change city
          </Button>
        </>
      )}
    </HeaderDropdown>
  );
}
