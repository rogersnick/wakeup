"use client";

import { AlarmClock } from "lucide-react";
import { useEffect, useState } from "react";
import { CityInput } from "@/components/city-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card className="overflow-hidden p-0">
      <div className="bg-primary px-8 py-8 text-primary-foreground">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">
          Up next
        </p>
        <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight sm:text-4xl">
          Your next wake-up
        </h2>
        <p className="mt-2 max-w-xl text-base text-primary-foreground/70">
          {scheduleSummary}
          {timezone ? ` · ${timezone}` : ""}
        </p>
      </div>

      <div className="grid gap-6 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 border-2 border-accent/40">
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
          <Badge variant={wakeup.status === "calling" ? "accent" : "primary"}>
            {wakeup.status}
          </Badge>
        </div>

        <div className="rounded-lg bg-primary/10 border-2 border-primary/20 p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            What you&apos;ll hear
          </p>
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
              <p className="mt-3 text-sm text-muted-foreground">
                Tone: {wakeup.scriptText}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => setShowCityEditor(true)}
              >
                Change city
              </Button>
            </>
          ) : (
            <p className="mt-3 text-lg leading-8 text-foreground">
              &ldquo;{message}&rdquo;
            </p>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Press 1 when you answer to confirm you&apos;re awake, or press 2 to
          snooze for 5 minutes.
          {wakeup.snoozeCount > 0 ? (
            <> Snoozed {wakeup.snoozeCount} time{wakeup.snoozeCount === 1 ? "" : "s"} today.</>
          ) : null}{" "}
          Cancel below if you need to change your schedule.
        </p>
      </div>
    </Card>
  );
}
