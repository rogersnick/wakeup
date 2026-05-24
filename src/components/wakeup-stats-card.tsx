import { Card, CardDescription, CardEyebrow, CardTitle } from "@/components/ui/card";
import type { WakeUpStats } from "@/lib/wakeup/stats";

type Props = {
  stats: WakeUpStats;
};

export function WakeUpStatsCard({ stats }: Props) {
  return (
    <Card className="p-6">
      <CardEyebrow>Wake-up consistency</CardEyebrow>
      <CardTitle className="mt-2 text-2xl">Your morning proof</CardTitle>
      <CardDescription className="mt-2">
        Confirmed wake-ups from your call history.
      </CardDescription>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border-2 border-border p-4">
          <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            This week
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-foreground">
            {stats.confirmedThisWeek}
          </dd>
        </div>
        <div className="border-2 border-border p-4">
          <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Current streak
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-foreground">
            {stats.currentStreak}
          </dd>
        </div>
        <div className="border-2 border-border p-4">
          <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Total confirmed
          </dt>
          <dd className="mt-2 text-3xl font-extrabold text-foreground">
            {stats.totalConfirmed}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
