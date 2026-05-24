"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CITY_WEATHER_FORMAT_HINT } from "@/lib/weather";
import { dispatchProfileUpdated } from "@/lib/profile-events";

type Props = {
  city?: string | null;
  cityResolvedLabel?: string | null;
  onSaved: () => void;
  onCancel?: () => void;
  variant?: "card" | "inline";
};

export function CityInput({
  city,
  cityResolvedLabel,
  onSaved,
  onCancel,
  variant = "card",
}: Props) {
  const [value, setValue] = useState(city ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const savedCityNeedsFix =
    Boolean(city?.trim()) && cityResolvedLabel === null && value.trim() === city?.trim();

  async function saveCity() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: value }),
      });
      const data = (await response.json()) as {
        error?: string;
        user?: { cityResolvedLabel?: string | null };
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save city");
      }

      const resolvedLabel = data.user?.cityResolvedLabel;
      setSuccess(
        resolvedLabel
          ? `City saved. Weather will use ${resolvedLabel}.`
          : "City saved.",
      );
      dispatchProfileUpdated();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save city");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    if (loading) {
      return;
    }

    setValue(city ?? "");
    setError(null);
    setSuccess(null);
    onCancel?.();
  }

  const form = (
    <>
      <div className="flex flex-wrap gap-3">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. Calgary or Calgary, Canada"
          maxLength={100}
          className={variant === "inline" ? "min-w-48 flex-1" : "max-w-md"}
        />
        <Button
          type="button"
          onClick={() => void saveCity()}
          disabled={loading || value.trim().length === 0}
        >
          {loading ? "Saving..." : "Save city"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {CITY_WEATHER_FORMAT_HINT}
      </p>

      {cityResolvedLabel && !savedCityNeedsFix ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Weather location: {cityResolvedLabel}
        </p>
      ) : null}

      {savedCityNeedsFix ? (
        <Alert variant="error" className="mt-4">
          Your saved city won&apos;t work for weather lookup. Update it using
          the format above.
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" className="mt-4">
          {success}
        </Alert>
      ) : null}
    </>
  );

  if (variant === "inline") {
    return <div className="grid gap-3">{form}</div>;
  }

  return (
    <Card className="p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/20 border-2 border-primary/40 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle>Where do you wake up?</CardTitle>
          <CardDescription className="mt-1">
            Required for weather reports in your wake-up calls. Enter your city
            name, or city and country.
          </CardDescription>

          <div className="mt-4">{form}</div>
        </div>
      </div>
    </Card>
  );
}
