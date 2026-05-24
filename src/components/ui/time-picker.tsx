"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

const HOURS = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

type Period = "AM" | "PM";

type ParsedTime = {
  hour12: number;
  minute: number;
  period: Period;
};

export function parseTimeValue(value: string): ParsedTime {
  const [hours, minutes] = value.split(":").map(Number);
  const period: Period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return { hour12, minute: minutes, period };
}

export function toTimeValue(hour12: number, minute: number, period: Period): string {
  let hours = hour12;

  if (period === "AM" && hour12 === 12) {
    hours = 0;
  } else if (period === "PM" && hour12 !== 12) {
    hours = hour12 + 12;
  } else if (period === "PM" && hour12 === 12) {
    hours = 12;
  }

  return `${hours.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function formatTimeLabel(time: string) {
  const { hour12, minute, period } = parseTimeValue(time);
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function ColumnButton({
  selected,
  onClick,
  children,
  buttonRef,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 min-w-[3.25rem] items-center justify-center rounded-md px-2 text-sm font-bold transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-background text-foreground hover:bg-border",
      )}
    >
      {children}
    </button>
  );
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const { hour12, minute, period } = parseTimeValue(value);
  const hourRef = useRef<HTMLButtonElement>(null);
  const minuteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    hourRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    minuteRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  function update(next: Partial<ParsedTime>) {
    const parsed = parseTimeValue(value);
    onChange(
      toTimeValue(
        next.hour12 ?? parsed.hour12,
        next.minute ?? parsed.minute,
        next.period ?? parsed.period,
      ),
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg bg-muted p-5",
        className,
      )}
      role="group"
      aria-label="Choose a custom time"
    >
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-5xl font-extrabold tracking-tight text-foreground">
          {hour12}
        </span>
        <span className="text-4xl font-extrabold text-primary">:</span>
        <span className="text-5xl font-extrabold tracking-tight text-foreground">
          {minute.toString().padStart(2, "0")}
        </span>
        <span className="ml-2 text-2xl font-bold text-primary">{period}</span>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(7rem,1fr)_minmax(10rem,1.35fr)_auto]">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hour
          </p>
          <div className="grid grid-cols-3 gap-2">
            {HOURS.map((hour) => (
              <ColumnButton
                key={hour}
                selected={hour12 === hour}
                buttonRef={hour12 === hour ? hourRef : undefined}
                onClick={() => update({ hour12: hour })}
              >
                {hour}
              </ColumnButton>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Minute
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MINUTES.map((min) => (
              <ColumnButton
                key={min}
                selected={minute === min}
                buttonRef={minute === min ? minuteRef : undefined}
                onClick={() => update({ minute: min })}
              >
                {min.toString().padStart(2, "0")}
              </ColumnButton>
            ))}
          </div>
        </div>

        <div className="sm:min-w-[4.5rem]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Period
          </p>
          <div className="flex flex-col gap-2">
            {(["AM", "PM"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => update({ period: option })}
                className={cn(
                  "flex h-11 w-full min-w-[3.25rem] items-center justify-center rounded-md text-sm font-bold transition-colors sm:w-16 sm:h-14 sm:text-base",
                  period === option
                    ? "bg-accent text-accent-foreground"
                    : "bg-background text-foreground hover:bg-border",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Tap hour, minute, and AM/PM to set your wake-up time.
      </p>
    </div>
  );
}
