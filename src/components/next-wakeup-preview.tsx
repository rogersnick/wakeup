"use client";

import { AlarmClock } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CityInput } from "@/components/city-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardEyebrow, CardPanel } from "@/components/ui/card";
import { formatTimeLabel } from "@/components/ui/time-picker";
import { REQUEST_CITY_CHANGE_EVENT } from "@/lib/profile-events";
import {
  formatScheduleSummary,
  formatWakeupMessage,
  type WakeupDisplay,
} from "@/lib/wakeup/display";

type Props = {
  wakeup: WakeupDisplay;
  userCity?: string | null;
  city?: string | null;
  cityResolvedLabel?: string | null;
  onCitySaved?: () => void;
  timezone?: string | null;
};

export function NextWakeupPreview({
  wakeup,
  userCity,
  city,
  cityResolvedLabel,
  onCitySaved,
  timezone,
}: Props) {
  const [showCityEditor, setShowCityEditor] = useState(false);
  const hasValidWeatherCity = Boolean(cityResolvedLabel);
  const isWeatherReport = wakeup.scriptMode === "dynamic";

  useEffect(() => {
    function openCityEditor() {
      setShowCityEditor(true);
    }

    window.addEventListener(REQUEST_CITY_CHANGE_EVENT, openCityEditor);
    return () => {
      window.removeEventListener(REQUEST_CITY_CHANGE_EVENT, openCityEditor);
    };
  }, []);

  function handleCityCancel() {
    setShowCityEditor(false);
  }

  function handleCitySaved() {
    setShowCityEditor(false);
    onCitySaved?.();
  }

  const nextAttempt = new Date(wakeup.nextAttemptAt);
  const message = formatWakeupMessage(wakeup, userCity);
  const scheduleSummary = formatScheduleSummary(
    wakeup.type,
    wakeup.scheduledDate,
    wakeup.scheduledTimeLocal,
    wakeup.recurrence?.days ?? null,
  );

  return (
    <Card className="overflow-hidden p-0" variant="primary">
      <div className="border-b-2 border-primary bg-foreground px-8 py-8 text-background">
        <CardEyebrow>Up next</CardEyebrow>
        <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">
          Your next wake-up
        </h2>
        <p className="mt-2 max-w-xl text-base opacity-70">
          {scheduleSummary}
          {timezone ? ` · ${timezone}` : ""}
        </p>
      </div>

      <div className="grid gap-6 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-foreground bg-accent/20">
              <AlarmClock className="h-8 w-8 text-accent" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-4xl font-extrabold tracking-tight">
                {formatTimeLabel(wakeup.scheduledTimeLocal)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextAttempt.toLocaleString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={wakeup.status === "calling" ? "accent" : "primary"}>
              {wakeup.status}
            </Badge>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 border-2 border-foreground bg-foreground px-3 py-1.5 text-background">
                <span className="font-mono text-base font-extrabold leading-none">1</span>
                <span className="font-mono text-xs font-bold uppercase tracking-widest">I&apos;m awake</span>
              </div>
              <div className="flex items-center gap-2 border-2 border-foreground px-3 py-1.5">
                <span className="font-mono text-base font-extrabold leading-none">2</span>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground">+5 min</span>
              </div>
            </div>
            {wakeup.snoozeCount > 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                Snoozed {wakeup.snoozeCount}× today
              </p>
            ) : null}
          </div>
        </div>

        <CardPanel variant="primary">
          <CardEyebrow className="text-primary">What you&apos;ll hear</CardEyebrow>
          {isWeatherReport && (!hasValidWeatherCity || showCityEditor) ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Add your city to include local weather in this wake-up.
              </p>
              <div className="mt-4">
                <CityInput
                  key={city ?? "unset"}
                  variant="inline"
                  city={city}
                  cityResolvedLabel={cityResolvedLabel}
                  onSaved={handleCitySaved}
                  onCancel={
                    hasValidWeatherCity ? handleCityCancel : undefined
                  }
                />
              </div>
            </div>
          ) : isWeatherReport && !wakeup.resolvedScriptText ? (
            <>
              <p className="mt-3 text-lg leading-8 text-foreground">{message}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 border-foreground bg-foreground text-background hover:bg-foreground hover:text-orange-500"
                onClick={() => setShowCityEditor(true)}
              >
                Change city
              </Button>
            </>
          ) : (
            <p className="text-lg leading-8 text-foreground">
              &ldquo;{message}&rdquo;
            </p>
          )}
        </CardPanel>

        <p className="text-xs text-muted-foreground">
          Need to cancel?{" "}
          <Link
            href="/dashboard/wakeups"
            className="font-semibold text-foreground underline-offset-4 hover:underline hover:text-red-500"
          >
            Manage in Wake-ups →
          </Link>
        </p>
      </div>
    </Card>
  );
}
