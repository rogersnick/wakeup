"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dispatchProfileUpdated } from "@/lib/profile-events";
import {
  ZODIAC_SIGNS,
  type ModePrerequisite,
  type UserProfileContext,
  type ZodiacSign,
} from "@/lib/wakeup/modes";

type Props = {
  profile: UserProfileContext;
  required: ModePrerequisite[];
  onSaved: () => void;
  onCancel?: () => void;
};

export function ProfilePreferencesInput({
  profile,
  required,
  onSaved,
  onCancel,
}: Props) {
  const [favoriteTeam, setFavoriteTeam] = useState(profile.favoriteTeam ?? "");
  const [marketSymbols, setMarketSymbols] = useState(profile.marketSymbols ?? "");
  const [zodiacSign, setZodiacSign] = useState<ZodiacSign | "">(
    profile.zodiacSign ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveField(body: Record<string, string>) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save profile");
      }
      dispatchProfileUpdated();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      {required.includes("favoriteTeam") ? (
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">Favorite team</span>
          <div className="flex flex-wrap gap-3">
            <Input
              value={favoriteTeam}
              onChange={(event) => setFavoriteTeam(event.target.value)}
              placeholder="e.g. Toronto Raptors, Calgary Flames, Arsenal"
              className="min-w-48 flex-1"
            />
            <p className="text-sm text-muted-foreground">
              Use the full team name when you can. Nicknames like Raptors usually work too.
            </p>
            <Button
              type="button"
              disabled={loading || favoriteTeam.trim().length === 0}
              onClick={() => void saveField({ favoriteTeam })}
            >
              Save team
            </Button>
          </div>
        </label>
      ) : null}

      {required.includes("marketSymbols") ? (
        <label className="grid gap-2">
          <span className="text-sm text-muted-foreground">
            Stock symbols (comma-separated)
          </span>
          <div className="flex flex-wrap gap-3">
            <Input
              value={marketSymbols}
              onChange={(event) => setMarketSymbols(event.target.value)}
              placeholder="e.g. AAPL, TSLA, MSFT"
              className="min-w-48 flex-1"
            />
            <Button
              type="button"
              disabled={loading || marketSymbols.trim().length === 0}
              onClick={() => void saveField({ marketSymbols })}
            >
              Save symbols
            </Button>
          </div>
        </label>
      ) : null}

      {required.includes("zodiacSign") ? (
        <div className="grid gap-2">
          <span className="text-sm text-muted-foreground">Zodiac sign</span>
          <div className="flex flex-wrap gap-2">
            {ZODIAC_SIGNS.map((sign) => (
              <button
                key={sign}
                type="button"
                disabled={loading}
                onClick={() => {
                  setZodiacSign(sign);
                  void saveField({ zodiacSign: sign });
                }}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  zodiacSign === sign
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-border hover:text-[#ff6a00]",
                ].join(" ")}
              >
                {sign}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {onCancel ? (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      ) : null}

      {error ? <Alert variant="error">{error}</Alert> : null}
    </div>
  );
}
