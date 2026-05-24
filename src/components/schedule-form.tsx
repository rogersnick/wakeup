"use client";

import { addDays, addMinutes, format, parseISO } from "date-fns";
import {
  AlarmClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Play,
  Repeat,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker, formatTimeLabel } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_PRESETS = ["05:30", "06:00", "06:30", "07:00", "07:30", "08:00"];
const COLLAPSED_VOICE_COUNT = 4;

const MESSAGE_PRESETS = [
  {
    label: "Gentle nudge",
    text: "Good morning. This is your wake up call. Time to get out of bed.",
  },
  {
    label: "Up and at 'em",
    text: "Rise and shine! You've got a great day ahead. Let's go!",
  },
  {
    label: "No snoozing",
    text: "Hey — time to get up. No snoozing today.",
  },
  {
    label: "Goal getter",
    text: "Wake up! Your goals aren't going to chase themselves.",
  },
] as const;

const TONE_PRESETS = [
  { label: "Gentle", text: "gentle and calm" },
  { label: "Pep talk", text: "motivational pep talk" },
  { label: "Funny", text: "light and funny" },
] as const;

const STEPS = [
  { id: "when", label: "When", icon: AlarmClock },
  { id: "message", label: "Message", icon: MessageSquare },
  { id: "confirm", label: "Confirm", icon: Sparkles },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type Props = {
  disabled: boolean;
  userCity?: string | null;
  onCreated: () => void;
};

type Voice = {
  voiceId: string;
  name: string;
  description?: string;
};

function formatScheduleSummary(
  type: "one_shot" | "recurring",
  scheduledDate: string,
  scheduledTimeLocal: string,
  days: number[],
) {
  const time = formatTimeLabel(scheduledTimeLocal);

  if (type === "one_shot") {
    const dateLabel = scheduledDate
      ? format(parseISO(scheduledDate), "EEEE, MMM d")
      : "Pick a date";
    return `${dateLabel} at ${time}`;
  }

  if (days.length === 7) {
    return `Every day at ${time}`;
  }

  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) {
    return `Weekdays at ${time}`;
  }

  if (days.length === 2 && days.includes(0) && days.includes(6)) {
    return `Weekends at ${time}`;
  }

  const dayNames = days.map((day) => DAY_NAMES[day]).join(", ");
  return `${dayNames} at ${time}`;
}

function StepIndicator({ currentStep }: { currentStep: StepId }) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isComplete = index < currentIndex;
        const isCurrent = step.id === currentStep;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-11 items-center gap-2 rounded-md px-3 transition-all duration-200",
                isCurrent && "bg-primary text-white",
                isComplete && "bg-blue-100 text-primary",
                !isCurrent && !isComplete && "bg-muted text-gray-500",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
              <span className="hidden text-xs font-semibold uppercase tracking-wider sm:inline">
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "h-1 w-6 rounded-full transition-colors duration-200",
                  index < currentIndex ? "bg-primary" : "bg-gray-200",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ScheduleForm({ disabled, userCity, onCreated }: Props) {
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
  const [voicesExpanded, setVoicesExpanded] = useState(false);
  const [previewLoadingVoiceId, setPreviewLoadingVoiceId] = useState<string | null>(null);
  const [previewVoiceId, setPreviewVoiceId] = useState<string | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  const scheduleSummary = formatScheduleSummary(
    type,
    scheduledDate,
    scheduledTimeLocal,
    days,
  );
  const selectedVoice = voices.find((voice) => voice.voiceId === selectedVoiceId);
  const collapsedVoices = voices.slice(0, COLLAPSED_VOICE_COUNT);
  const visibleVoices =
    voicesExpanded || !selectedVoice || collapsedVoices.includes(selectedVoice)
      ? voicesExpanded
        ? voices
        : collapsedVoices
      : [...collapsedVoices, selectedVoice];

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

  function canAdvanceFromWhen() {
    if (type === "one_shot") {
      return scheduledDate.length > 0;
    }
    return days.length > 0;
  }

  function canAdvanceFromMessage() {
    if (scriptMode === "dynamic") {
      return Boolean(userCity?.trim());
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
      <Card className="overflow-hidden p-0 opacity-60">
        <div className="bg-primary px-8 py-10 text-white">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
            Step 1 of 3
          </p>
          <CardTitle className="mt-2 text-3xl text-white">
            Verify your phone first
          </CardTitle>
          <CardDescription className="text-blue-100">
            Once your number is confirmed, you can set your first wake-up call.
          </CardDescription>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-primary px-8 py-8 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-100">
              New wake-up
            </p>
            <CardTitle className="mt-2 text-3xl text-white sm:text-4xl">
              {step === "when" && "When should we call?"}
              {step === "message" && "What should we say?"}
              {step === "confirm" && "Ready to schedule?"}
            </CardTitle>
            <CardDescription className="mt-2 max-w-xl text-base text-blue-100">
              {step === "when" &&
                "Pick a time that actually gets you out of bed."}
              {step === "message" &&
                "This is what you'll hear when the phone rings."}
              {step === "confirm" &&
                "Double-check the details, then lock it in."}
            </CardDescription>
          </div>
          <StepIndicator currentStep={step} />
        </div>
      </div>

      <div className="grid gap-8 p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {step === "when" ? (
            <div className="grid gap-8">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: "recurring" as const,
                    title: "Every week",
                    description: "Same days, same time — your routine.",
                    icon: Repeat,
                    tint: "bg-emerald-50 hover:bg-emerald-100",
                    active: "ring-4 ring-secondary bg-emerald-100",
                  },
                  {
                    value: "one_shot" as const,
                    title: "Just once",
                    description: "One morning, one call — no repeat.",
                    icon: CalendarDays,
                    tint: "bg-blue-50 hover:bg-blue-100",
                    active: "ring-4 ring-primary bg-blue-100",
                  },
                ].map(({ value, title, description, icon: Icon, tint, active }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      "group rounded-lg p-6 text-left transition-all duration-200 hover:scale-[1.02]",
                      type === value ? active : tint,
                    )}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white transition-transform duration-200 group-hover:scale-110">
                      <Icon
                        className={cn(
                          "h-7 w-7",
                          value === "recurring" ? "text-secondary" : "text-primary",
                        )}
                        strokeWidth={2.25}
                      />
                    </div>
                    <p className="mt-4 text-lg font-bold tracking-tight">{title}</p>
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                  </button>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Pick a time
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {TIME_PRESETS.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        setScheduledTimeLocal(time);
                        setCustomTime(false);
                      }}
                      className={cn(
                        "rounded-md px-3 py-3 text-sm font-bold transition-all duration-200 hover:scale-105",
                        scheduledTimeLocal === time && !customTime
                          ? "bg-primary text-white"
                          : "bg-muted text-foreground hover:bg-gray-200",
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
                      "rounded-md px-3 py-3 text-sm font-bold transition-all duration-200 hover:scale-105",
                      customTime
                        ? "bg-accent text-amber-950"
                        : "bg-muted text-foreground hover:bg-gray-200",
                    )}
                  >
                    {customTime ? formatTimeLabel(scheduledTimeLocal) : "Custom"}
                  </button>
                  {type === "one_shot" ? (
                    <button
                      type="button"
                      onClick={scheduleInFiveMinutes}
                      className="rounded-md bg-muted px-3 py-3 text-sm font-bold text-foreground transition-all duration-200 hover:scale-105 hover:bg-gray-200"
                    >
                      In 5 minutes
                    </button>
                  ) : null}
                </div>
                {customTime ? (
                  <TimePicker
                    className="mt-4"
                    value={scheduledTimeLocal}
                    onChange={setScheduledTimeLocal}
                  />
                ) : null}
              </div>

              {type === "one_shot" ? (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Which day?
                  </p>
                  <div className="mt-3 max-w-xs">
                    <Input
                      type="date"
                      value={scheduledDate}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(event) => setScheduledDate(event.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Which days?
                    </p>
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
                          className="rounded-md bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:scale-105"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between gap-2">
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
                            "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 hover:scale-110",
                            selected
                              ? "bg-accent text-amber-950"
                              : "bg-muted text-gray-600 hover:bg-gray-200",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {step === "message" ? (
            <div className="grid gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Message style
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScriptMode("static");
                      setPreviewVoiceId(null);
                      setPreviewAudioUrl(null);
                    }}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105",
                      scriptMode === "static"
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground hover:bg-gray-200",
                    )}
                  >
                    Write my own
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScriptMode("dynamic");
                      setPreviewVoiceId(null);
                      setPreviewAudioUrl(null);
                    }}
                    disabled={!userCity?.trim()}
                    className={cn(
                      "rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105",
                      scriptMode === "dynamic"
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground hover:bg-gray-200",
                      !userCity?.trim() && "cursor-not-allowed opacity-50",
                    )}
                  >
                    Surprise me
                  </button>
                </div>
                {scriptMode === "dynamic" && !userCity?.trim() ? (
                  <Alert variant="error" className="mt-3">
                    Set your city above before using surprise wake-ups.
                  </Alert>
                ) : null}
              </div>

              {scriptMode === "static" ? (
                <>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Start with a vibe
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
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
                            "rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105",
                            scriptText === preset.text
                              ? "bg-primary text-white"
                              : "bg-muted text-foreground hover:bg-gray-200",
                          )}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Your wake-up script
                    </p>
                    <Textarea
                      className="mt-3 min-h-36 text-base"
                      value={scriptText}
                      maxLength={500}
                      onChange={(event) => {
                        setScriptText(event.target.value);
                        setPreviewVoiceId(null);
                        setPreviewAudioUrl(null);
                      }}
                      required
                    />
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                      <span>Speak like you&apos;re talking to yourself at 7 AM.</span>
                      <span>{scriptText.length}/500</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-blue-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                    Surprise me
                  </p>
                  <p className="mt-2 text-sm leading-7 text-gray-700">
                    Each morning we&apos;ll write a unique wake-up message for you,
                    including today&apos;s weather in {userCity}. We can&apos;t preview
                    it ahead of time — that&apos;s the surprise.
                  </p>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Optional tone
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TONE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setToneHint(preset.text)}
                        className={cn(
                          "rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105",
                          toneHint === preset.text
                            ? "bg-primary text-white"
                            : "bg-white text-foreground hover:bg-gray-100",
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border-2 border-muted p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Choose a voice
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Pick a voice, then preview it from the card.
                    </p>
                  </div>
                </div>

                {voicesLoading ? (
                  <p className="mt-4 text-sm text-gray-600">Loading voices...</p>
                ) : null}

                {voiceError ? (
                  <Alert variant="error" className="mt-4">
                    {voiceError}
                  </Alert>
                ) : null}

                {!voicesLoading && voices.length > 0 ? (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {visibleVoices.map((voice) => {
                        const isSelected = selectedVoiceId === voice.voiceId;
                        const isPreviewing = previewLoadingVoiceId === voice.voiceId;
                        const hasPreview = previewVoiceId === voice.voiceId && previewAudioUrl;

                        return (
                          <div
                            key={voice.voiceId}
                            className={cn(
                              "rounded-lg p-4 transition-all duration-200",
                              isSelected
                                ? "bg-primary text-white ring-4 ring-blue-100"
                                : "bg-muted text-foreground",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVoiceId(voice.voiceId);
                                  setPreviewVoiceId(null);
                                  setPreviewAudioUrl(null);
                                }}
                                className="min-w-0 flex-1 text-left"
                                aria-pressed={isSelected}
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={cn(
                                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                      isSelected ? "bg-white/15" : "bg-white",
                                    )}
                                  >
                                    <Volume2 className="h-5 w-5" />
                                  </span>
                                  <span className="font-bold">{voice.name}</span>
                                </div>
                              </button>

                              <Button
                                type="button"
                                variant={isSelected ? "ghost" : "secondary"}
                                size="sm"
                                onClick={() => void playPreview(voice.voiceId)}
                                disabled={
                                  isPreviewing ||
                                  scriptMode === "dynamic" ||
                                  scriptText.trim().length === 0
                                }
                                className={cn(
                                  "shrink-0 gap-2",
                                  isSelected && "text-white hover:bg-white/15",
                                )}
                              >
                                {isPreviewing ? "Generating..." : "Preview"}
                                {!isPreviewing ? <Play className="h-4 w-4" /> : null}
                              </Button>
                            </div>

                            {voice.description ? (
                              <p
                                className={cn(
                                  "mt-3 text-sm leading-6",
                                  isSelected ? "text-blue-100" : "text-gray-600",
                                )}
                              >
                                {voice.description}
                              </p>
                            ) : null}

                            {hasPreview ? (
                              <audio
                                key={previewAudioUrl}
                                src={previewAudioUrl}
                                controls
                                autoPlay
                                className="mt-4 w-full"
                              >
                                <track kind="captions" />
                              </audio>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {voices.length > COLLAPSED_VOICE_COUNT ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setVoicesExpanded((current) => !current)}
                        className="mt-4"
                      >
                        {voicesExpanded
                          ? "Show fewer voices"
                          : `Show ${voices.length - COLLAPSED_VOICE_COUNT} more voices`}
                      </Button>
                    ) : null}
                  </>
                ) : null}

                {!voicesLoading && !voiceError && voices.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-600">
                    No voices found. Scheduling will use your default voice.
                  </p>
                ) : null}

              </div>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="grid gap-6">
              <div className="rounded-lg bg-muted p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Your wake-up
                </p>
                <p className="mt-3 text-2xl font-extrabold tracking-tight">
                  {scheduleSummary}
                </p>
                <p className="mt-2 text-sm text-gray-600">{timezone}</p>
              </div>

              <div className="rounded-lg bg-blue-50 p-6">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  What you&apos;ll hear
                </p>
                {scriptMode === "dynamic" ? (
                  <>
                    <p className="mt-3 text-lg leading-8 text-gray-800">
                      A unique surprise message each morning — including today&apos;s
                      weather in {userCity}.
                    </p>
                    <p className="mt-3 text-sm text-gray-600">
                      Tone: {toneHint}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-lg leading-8 text-gray-800">
                    &ldquo;{scriptText}&rdquo;
                  </p>
                )}
                <p className="mt-4 text-sm font-semibold text-gray-600">
                  Voice: {selectedVoice?.name ?? "Default voice"}
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Press 1 when you answer to confirm you&apos;re awake. We&apos;ll
                retry if you miss the call.
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            {step !== "when" ? (
              <Button type="button" variant="secondary" onClick={goBack} className="gap-2">
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
                {loading ? "Scheduling..." : "Schedule my wake-up"}
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

        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-lg bg-gray-900 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Preview
            </p>
            <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <AlarmClock className="h-8 w-8 text-accent" strokeWidth={2.25} />
            </div>
            <p className="mt-6 text-3xl font-extrabold tracking-tight">
              {formatTimeLabel(scheduledTimeLocal)}
            </p>
            <p className="mt-2 text-sm text-gray-400">{scheduleSummary}</p>
            <div className="mt-6 border-t-2 border-white/10 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Script
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300 line-clamp-6">
                {scriptText}
              </p>
            </div>
            <div className="mt-6 border-t-2 border-white/10 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Voice
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-200">
                {selectedVoice?.name ?? "Default voice"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Card>
  );
}
