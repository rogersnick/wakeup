"use client";

import { addDays, addMinutes, format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CityInput } from "@/components/city-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker, formatTimeLabel } from "@/components/ui/time-picker";
import {
  REQUEST_CITY_CHANGE_EVENT,
} from "@/lib/profile-events";
import { cn } from "@/lib/utils";
import { formatScheduleSummary } from "@/lib/wakeup/display";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_PRESETS = ["06:00", "06:30", "07:00", "07:30", "08:00"];

const MESSAGE_PRESETS = [
  { label: "Gentle", text: "Good morning. This is your wake up call. Time to get out of bed." },
  { label: "Energetic", text: "Rise and shine! You've got a great day ahead. Let's go!" },
  { label: "Direct", text: "Hey — time to get up. No snoozing today." },
] as const;

const TONE_PRESETS = [
  { label: "Gentle", text: "gentle and calm" },
  { label: "Pep talk", text: "motivational pep talk" },
  { label: "Funny", text: "light and funny" },
] as const;

const STEPS = [
  { id: "when", label: "When" },
  { id: "message", label: "Message" },
  { id: "confirm", label: "Confirm" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type Props = {
  disabled: boolean;
  userCity?: string | null;
  cityResolvedLabel?: string | null;
  onCreated: () => void;
  onCitySaved: () => void;
};

type Voice = {
  voiceId: string;
  name: string;
  description?: string;
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabledValues = [],
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabledValues?: T[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabledValues.includes(option.value);

        return (
          <button
            key={option.value}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isSelected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              isDisabled && "cursor-not-allowed opacity-40",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: StepId }) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <span
            className={cn(
              index <= currentIndex ? "text-foreground" : undefined,
              index === currentIndex && "font-semibold",
            )}
          >
            {step.label}
          </span>
          {index < STEPS.length - 1 ? (
            <span aria-hidden className="text-border">
              /
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ScheduleForm({
  disabled,
  userCity,
  cityResolvedLabel,
  onCreated,
  onCitySaved,
}: Props) {
  const tomorrow = useMemo(() => format(addDays(new Date(), 1), "yyyy-MM-dd"), []);

  const [step, setStep] = useState<StepId>("when");
  const [type, setType] = useState<"one_shot" | "recurring">("recurring");
  const [scheduledDate, setScheduledDate] = useState(tomorrow);
  const [scheduledTimeLocal, setScheduledTimeLocal] = useState("07:00");
  const [customTime, setCustomTime] = useState(false);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [scriptMode, setScriptMode] = useState<"static" | "dynamic">("static");
  const [scriptText, setScriptText] = useState<string>(MESSAGE_PRESETS[0].text);
  const [toneHint, setToneHint] = useState<string>(TONE_PRESETS[0].text);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [previewLoadingVoiceId, setPreviewLoadingVoiceId] = useState<string | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCityEditor, setShowCityEditor] = useState(false);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const scheduleSummary = formatScheduleSummary(
    type,
    type === "one_shot" ? scheduledDate : null,
    scheduledTimeLocal,
    type === "recurring" ? days : null,
  );
  const selectedVoice = voices.find((voice) => voice.voiceId === selectedVoiceId);

  useEffect(() => {
    if (disabled) {
      return;
    }

    let cancelled = false;

    async function fetchVoices() {
      setVoicesLoading(true);
      setVoiceError(null);

      try {
        const response = await fetch("/api/voices");
        const data = (await response.json()) as {
          voices?: Voice[];
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load voices");
        }

        const availableVoices = data.voices ?? [];
        setVoices(availableVoices);
        setSelectedVoiceId((current) => current || availableVoices[0]?.voiceId || "");
      } catch (err) {
        if (!cancelled) {
          setVoiceError(err instanceof Error ? err.message : "Failed to load voices");
        }
      } finally {
        if (!cancelled) {
          setVoicesLoading(false);
        }
      }
    }

    void fetchVoices();

    return () => {
      cancelled = true;
    };
  }, [disabled]);

  useEffect(() => {
    if (!previewAudioUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewAudioUrl);
    };
  }, [previewAudioUrl]);

  useEffect(() => {
    function openCityEditor() {
      setStep("message");
      setScriptMode("dynamic");
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
    onCitySaved();
  }

  function toggleDay(day: number) {
    setDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort(),
    );
  }

  function selectWeekdays() {
    setDays([1, 2, 3, 4, 5]);
  }

  function selectWeekends() {
    setDays([0, 6]);
  }

  function selectEveryDay() {
    setDays([0, 1, 2, 3, 4, 5, 6]);
  }

  function scheduleInFiveMinutes() {
    const target = addMinutes(new Date(), 5);
    setScheduledDate(format(target, "yyyy-MM-dd"));
    setScheduledTimeLocal(format(target, "HH:mm"));
    setCustomTime(true);
  }

  const weatherCityLabel = cityResolvedLabel ?? userCity?.trim() ?? null;
  const hasValidWeatherCity = Boolean(cityResolvedLabel);

  function canAdvanceFromWhen() {
    if (type === "one_shot") {
      return scheduledDate.length > 0;
    }
    return days.length > 0;
  }

  function canAdvanceFromMessage() {
    if (scriptMode === "dynamic") {
      return hasValidWeatherCity;
    }
    return scriptText.trim().length > 0;
  }

  function goNext() {
    if (step === "when" && canAdvanceFromWhen()) {
      setStep("message");
    } else if (step === "message" && canAdvanceFromMessage()) {
      setStep("confirm");
    }
  }

  function goBack() {
    if (step === "message") {
      setStep("when");
    } else if (step === "confirm") {
      setStep("message");
    }
  }

  async function playPreview(voiceId: string) {
    if (!voiceId || scriptMode === "dynamic" || scriptText.trim().length === 0) {
      return;
    }

    setSelectedVoiceId(voiceId);
    setPreviewLoadingVoiceId(voiceId);
    setPreviewVoiceId(null);
    setPreviewAudioUrl(null);
    setError(null);

    try {
      const response = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText,
          voiceId,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to generate preview");
      }

      const audioBlob = await response.blob();
      setPreviewVoiceId(voiceId);
      setPreviewAudioUrl(URL.createObjectURL(audioBlob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setPreviewLoadingVoiceId(null);
    }
  }

  async function submit() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/wakeups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          scheduledDate: type === "one_shot" ? scheduledDate : null,
          scheduledTimeLocal,
          recurrence: type === "recurring" ? { days } : null,
          scriptText: scriptMode === "dynamic" ? toneHint : scriptText,
          scriptMode,
          voiceId: selectedVoiceId || undefined,
          timezone,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to schedule wake-up");
      }

      setSuccess("You're all set. We'll call you when it's time.");
      setStep("when");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule wake-up");
    } finally {
      setLoading(false);
    }
  }

  if (disabled) {
    return (
      <Card className="p-8 opacity-60">
        <CardTitle>Verify your phone first</CardTitle>
        <CardDescription className="mt-2">
          Once your number is confirmed, you can schedule your first wake-up call.
        </CardDescription>
      </Card>
    );
  }

  const stepTitle =
    step === "when"
      ? "When should we call?"
      : step === "message"
        ? "What should we say?"
        : "Review and schedule";

  const stepDescription =
    step === "when"
      ? "Choose your schedule and wake-up time."
      : step === "message"
        ? "Pick a message style and voice."
        : "Make sure everything looks right.";

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StepIndicator currentStep={step} />
            <CardTitle className="mt-3 text-2xl sm:text-3xl">{stepTitle}</CardTitle>
            <CardDescription className="mt-1 text-base">{stepDescription}</CardDescription>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            {formatTimeLabel(scheduledTimeLocal)}
          </p>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="mx-auto max-w-4xl">
          {step === "when" ? (
            <div className="grid gap-8">
              <Section title="Schedule">
                <div className="flex flex-wrap items-end gap-6">
                  <div className="grid gap-2">
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <SegmentedControl
                      value={type}
                      onChange={setType}
                      options={[
                        { value: "recurring", label: "Weekly" },
                        { value: "one_shot", label: "One time" },
                      ]}
                    />
                  </div>
                  {type === "one_shot" ? (
                    <div className="grid gap-2">
                      <p className="text-sm text-muted-foreground">Date</p>
                      <Input
                        type="date"
                        value={scheduledDate}
                        min={format(new Date(), "yyyy-MM-dd")}
                        onChange={(event) => setScheduledDate(event.target.value)}
                        className="w-full min-w-[12rem] sm:w-auto"
                        required
                      />
                    </div>
                  ) : null}
                </div>
              </Section>

              <Section title="Time">
                <div className="flex flex-wrap gap-2">
                  {TIME_PRESETS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        setScheduledTimeLocal(time);
                        setCustomTime(false);
                      }}
                      className={cn(
                        "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        scheduledTimeLocal === time && !customTime
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-border",
                      )}
                    >
                      {formatTimeLabel(time)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTime(true);
                      if (TIME_PRESETS.includes(scheduledTimeLocal)) {
                        setScheduledTimeLocal("07:00");
                      }
                    }}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      customTime
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-border",
                    )}
                  >
                    {customTime ? formatTimeLabel(scheduledTimeLocal) : "Custom"}
                  </button>
                  {type === "one_shot" ? (
                    <button
                      type="button"
                      onClick={scheduleInFiveMinutes}
                      className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border"
                    >
                      In 5 min
                    </button>
                  ) : null}
                </div>
                {customTime ? (
                  <TimePicker
                    className="mt-2"
                    value={scheduledTimeLocal}
                    onChange={setScheduledTimeLocal}
                  />
                ) : null}
              </Section>

              {type === "recurring" ? (
                <Section
                  title="Days"
                  description="Tap the days you want a call."
                >
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Weekdays", action: selectWeekdays },
                      { label: "Weekends", action: selectWeekends },
                      { label: "Every day", action: selectEveryDay },
                    ].map(({ label, action }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={action}
                        className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAY_LABELS.map((label, index) => {
                      const selected = days.includes(index);
                      return (
                        <button
                          key={`${label}-${index}`}
                          type="button"
                          aria-label={DAY_NAMES[index]}
                          aria-pressed={selected}
                          onClick={() => toggleDay(index)}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-border hover:text-foreground",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </Section>
              ) : null}
            </div>
          ) : null}

          {step === "message" ? (
            <div className="grid gap-8">
              <Section title="Message">
                <SegmentedControl
                  value={scriptMode}
                  onChange={(mode) => {
                    setScriptMode(mode);
                    setPreviewVoiceId(null);
                    setPreviewAudioUrl(null);
                    if (mode === "dynamic" && !hasValidWeatherCity) {
                      setShowCityEditor(true);
                    }
                  }}
                  options={[
                    { value: "static", label: "Write my own" },
                    { value: "dynamic", label: "Weather report" },
                  ]}
                />
              </Section>

              {scriptMode === "static" ? (
                <Section title="Script">
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setScriptText(preset.text);
                          setPreviewVoiceId(null);
                          setPreviewAudioUrl(null);
                        }}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          scriptText === preset.text
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-border hover:text-foreground",
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    className="min-h-32 text-base"
                    value={scriptText}
                    maxLength={500}
                    onChange={(event) => {
                      setScriptText(event.target.value);
                      setPreviewVoiceId(null);
                      setPreviewAudioUrl(null);
                    }}
                    required
                  />
                  <p className="text-right text-sm text-muted-foreground">
                    {scriptText.length}/500
                  </p>
                </Section>
              ) : (
                <Section
                  title="Weather report"
                  description={
                    hasValidWeatherCity
                      ? `Includes today's weather in ${weatherCityLabel}. Generated fresh each call.`
                      : "Add your city to include local weather in your wake-up."
                  }
                >
                  {!hasValidWeatherCity || showCityEditor ? (
                    <CityInput
                      key={userCity ?? "unset"}
                      variant="inline"
                      city={userCity}
                      cityResolvedLabel={cityResolvedLabel}
                      onSaved={handleCitySaved}
                      onCancel={
                        hasValidWeatherCity ? handleCityCancel : undefined
                      }
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Weather for {weatherCityLabel}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCityEditor(true)}
                      >
                        Change city
                      </Button>
                    </div>
                  )}

                  {hasValidWeatherCity && !showCityEditor ? (
                    <div className="flex flex-wrap gap-2">
                      {TONE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setToneHint(preset.text)}
                          className={cn(
                            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                            toneHint === preset.text
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-border hover:text-foreground",
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Section>
              )}

              <Section
                title="Voice"
                description={
                  scriptMode === "dynamic"
                    ? "Choose who delivers your weather report."
                    : "Choose a voice and preview your script."
                }
              >
                {voicesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading voices...</p>
                ) : null}

                {voiceError ? <Alert variant="error">{voiceError}</Alert> : null}

                {!voicesLoading && voices.length > 0 ? (
                  <div className="grid gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <select
                        value={selectedVoiceId}
                        onChange={(event) => {
                          setSelectedVoiceId(event.target.value);
                          setPreviewVoiceId(null);
                          setPreviewAudioUrl(null);
                        }}
                        className="h-11 w-full rounded-md border-2 border-border bg-muted px-4 text-sm font-medium text-foreground sm:max-w-sm"
                      >
                        {voices.map((voice) => (
                          <option key={voice.voiceId} value={voice.voiceId}>
                            {voice.name}
                          </option>
                        ))}
                      </select>

                      {scriptMode === "static" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void playPreview(selectedVoiceId)}
                          disabled={
                            !selectedVoiceId ||
                            previewLoadingVoiceId === selectedVoiceId ||
                            scriptText.trim().length === 0
                          }
                          className="gap-2 sm:shrink-0"
                        >
                          {previewLoadingVoiceId === selectedVoiceId
                            ? "Generating..."
                            : "Preview"}
                          {previewLoadingVoiceId !== selectedVoiceId ? (
                            <Play className="h-4 w-4" />
                          ) : null}
                        </Button>
                      ) : null}
                    </div>

                    {selectedVoice?.description ? (
                      <p className="text-sm text-muted-foreground">
                        {selectedVoice.description}
                      </p>
                    ) : null}

                    {previewVoiceId === selectedVoiceId && previewAudioUrl ? (
                      <audio
                        key={previewAudioUrl}
                        src={previewAudioUrl}
                        controls
                        autoPlay
                        className="w-full"
                      >
                        <track kind="captions" />
                      </audio>
                    ) : null}
                  </div>
                ) : null}

                {!voicesLoading && !voiceError && voices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No voices found. Scheduling will use your default voice.
                  </p>
                ) : null}
              </Section>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="grid gap-6">
              <div className="rounded-lg bg-muted p-6">
                <dl className="grid gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Schedule</dt>
                    <dd className="mt-1 text-lg font-semibold text-foreground">
                      {scheduleSummary}
                    </dd>
                    <dd className="text-muted-foreground">{timezone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Message</dt>
                    <dd className="mt-1 text-foreground">
                      {scriptMode === "dynamic" ? (
                        <>Weather report for {weatherCityLabel}</>
                      ) : (
                        <>&ldquo;{scriptText}&rdquo;</>
                      )}
                    </dd>
                    {scriptMode === "dynamic" ? (
                      <dd className="mt-1 text-muted-foreground">Tone: {toneHint}</dd>
                    ) : null}
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Voice</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {selectedVoice?.name ?? "Default voice"}
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="text-sm text-muted-foreground">
                Press 1 when you answer to confirm you&apos;re awake.
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            {step !== "when" ? (
              <Button type="button" variant="ghost" onClick={goBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step === "confirm" ? (
              <Button
                type="button"
                size="lg"
                disabled={loading}
                onClick={() => void submit()}
                className="gap-2"
              >
                {loading ? "Scheduling..." : "Schedule wake-up"}
                {!loading ? <Sparkles className="h-4 w-4" /> : null}
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                disabled={step === "when" ? !canAdvanceFromWhen() : !canAdvanceFromMessage()}
                onClick={goNext}
                className="gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {success ? <Alert variant="success" className="mt-4">{success}</Alert> : null}
          {error ? <Alert variant="error" className="mt-4">{error}</Alert> : null}
        </div>
      </div>
    </Card>
  );
}
