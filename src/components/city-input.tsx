"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  city?: string | null;
  onSaved: () => void;
};

export function CityInput({ city, onSaved }: Props) {
  const [value, setValue] = useState(city ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function saveCity() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: value }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save city");
      }
      setSuccess("City saved.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save city");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle>Where do you wake up?</CardTitle>
          <CardDescription className="mt-1">
            Used for weather in surprise wake-up calls. Example: Boston, MA
          </CardDescription>

          <div className="mt-4 flex flex-wrap gap-3">
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="City, State or City, Country"
              maxLength={100}
              className="max-w-md"
            />
            <Button
              type="button"
              onClick={() => void saveCity()}
              disabled={loading || value.trim().length === 0}
            >
              {loading ? "Saving..." : "Save city"}
            </Button>
          </div>

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
        </div>
      </div>
    </Card>
  );
}
