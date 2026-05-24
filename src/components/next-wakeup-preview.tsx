"use client";

import { useEffect, useState } from "react";
import { CityInput } from "@/components/city-input";
import { ConfirmCancelWakeupModal } from "@/components/confirm-cancel-wakeup-modal";
import { ProfilePreferencesInput } from "@/components/profile-preferences-input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardEyebrow } from "@/components/ui/card";
import { formatTimeLabel } from "@/components/ui/time-picker";
import { REQUEST_CITY_CHANGE_EVENT } from "@/lib/profile-events";
import {
  formatScheduleSummary,
  formatWakeupMessage,
  getWakeupCallControls,
  type WakeupDisplay,
} from "@/lib/wakeup/display";
import {
  getMissingPrerequisites,
  getModePrerequisites,
  isGeneratedMode,
  normalizeScriptMode,
  type UserProfileContext,
} from "@/lib/wakeup/modes";

type Props = {
  wakeup: WakeupDisplay;
  userCity?: string | null;
  city?: string | null;
  cityResolvedLabel?: string | null;
  favoriteTeam?: string | null;
  marketSymbols?: string | null;
  zodiacSign?: string | null;
  onCitySaved?: () => void;
  onCancelled?: () => void;
  timezone?: string | null;
};

export function NextWakeupPreview({
  wakeup,
  city,
  cityResolvedLabel,
  favoriteTeam,
  marketSymbols,
  zodiacSign,
  onCitySaved,
  onCancelled,
  timezone,
}: Props) {
  const [showCityEditor, setShowCityEditor] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const mode = normalizeScriptMode(wakeup.scriptMode);
  const isGenerated = isGeneratedMode(mode);
  const profileContext: UserProfileContext = {
    city,
    cityResolvedLabel,
    favoriteTeam,
    marketSymbols,
    zodiacSign: zodiacSign as UserProfileContext["zodiacSign"],
  };
  const missingPrerequisites = getMissingPrerequisites(
    mode,
    profileContext,
    wakeup.contentConfig,
  );
  const needsCity = getModePrerequisites(mode).includes("city");
  const hasValidWeatherCity = Boolean(cityResolvedLabel);

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

  function handleProfileSaved() {
    onCitySaved?.();
  }

  async function cancelWakeUp() {
    if (cancelling) {
      return;
    }

    setShowCancelConfirm(false);
    setCancelling(true);
    setCancelError(null);

    try {
      const response = await fetch(`/api/wakeups/${wakeup.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to cancel wake-up");
      }

      onCancelled?.();
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : "Failed to cancel wake-up",
      );
    } finally {
      setCancelling(false);
    }
  }

  const canCancel =
    wakeup.status !== "cancelled" && wakeup.status !== "confirmed";

  const nextAttempt = new Date(wakeup.nextAttemptAt);
  const message = formatWakeupMessage(wakeup, profileContext);
  const scheduleSummary = formatScheduleSummary(
    wakeup.type,
    wakeup.scheduledDate,
    wakeup.scheduledTimeLocal,
    wakeup.recurrence?.days ?? null,
  );
  const callControls = getWakeupCallControls(wakeup);

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
          <div>
            <p className="text-4xl font-extrabold tracking-tight">
              {formatTimeLabel(wakeup.scheduledTimeLocal)}
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              {nextAttempt.toLocaleString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {wakeup.status === "calling" ? (
              <Badge variant="accent">Calling now</Badge>
            ) : null}
            <div className="flex gap-2">
              {callControls.map((control) => (
                <div
                  key={control.id}
                  className={
                    control.primary
                      ? "flex items-center gap-2 border border-brand/50 bg-brand/12 px-3 py-1.5 text-foreground"
                      : "flex items-center gap-2 border border-border-light px-3 py-1.5"
                  }
                >
                  {control.digit ? (
                    <span className="font-mono text-base font-extrabold leading-none">
                      {control.digit}
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="font-mono text-base font-extrabold leading-none"
                    >
                      #
                    </span>
                  )}
                  <span
                    className={
                      control.primary
                        ? "font-mono text-xs font-bold uppercase tracking-widest"
                        : "font-mono text-xs font-bold uppercase tracking-widest text-muted-foreground"
                    }
                  >
                    {control.label}
                  </span>
                </div>
              ))}
            </div>
            {wakeup.snoozeCount > 0 ? (
              <p className="font-mono text-xs text-muted-foreground">
                Snoozed {wakeup.snoozeCount}× today
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <CardEyebrow className="text-brand">What you&apos;ll hear</CardEyebrow>
          {isGenerated && missingPrerequisites.length > 0 ? (
            <div className="mt-4 grid gap-4">
              <p className="text-base text-muted-foreground">
                Complete your profile to enable this wake-up.
              </p>
              {needsCity && (!hasValidWeatherCity || showCityEditor) ? (
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
              ) : null}
              {missingPrerequisites.some((item) => item !== "city") ? (
                <ProfilePreferencesInput
                  profile={profileContext}
                  required={getModePrerequisites(mode).filter(
                    (item) => item !== "city",
                  )}
                  onSaved={handleProfileSaved}
                />
              ) : null}
            </div>
          ) : isGenerated && !wakeup.resolvedScriptText ? (
            <>
              <p className="mt-3 text-lg leading-8 text-foreground">{message}</p>
              {needsCity ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-fit border-foreground bg-foreground text-background hover:bg-foreground hover:text-brand"
                  onClick={() => setShowCityEditor(true)}
                >
                  Change city
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-lg leading-8 text-foreground">
              &ldquo;{message}&rdquo;
            </p>
          )}
        </div>

        {cancelError ? <Alert variant="error">{cancelError}</Alert> : null}

        {canCancel ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={cancelling}
              className="hover:bg-foreground hover:text-red-500"
              onClick={() => setShowCancelConfirm(true)}
            >
              {cancelling ? "Cancelling..." : "Cancel wake-up"}
            </Button>
          </div>
        ) : null}
      </div>

      {showCancelConfirm ? (
        <ConfirmCancelWakeupModal
          onConfirm={() => void cancelWakeUp()}
          onDismiss={() => setShowCancelConfirm(false)}
        />
      ) : null}
    </Card>
  );
}
