import { and, eq, sql } from "drizzle-orm";
import { startOfWeek } from "date-fns";
import { getDb } from "@/lib/db";
import { users, wakeupAttempts, wakeups } from "@/lib/db/schema";

export type WakeUpStats = {
  confirmedThisWeek: number;
  currentStreak: number;
  totalConfirmed: number;
};

function toDateKey(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function getWakeUpStats(userId: string): Promise<WakeUpStats> {
  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  const timezone = user?.timezone ?? "America/Toronto";
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const confirmedAttempts = await db
    .select({
      completedAt: wakeupAttempts.completedAt,
      startedAt: wakeupAttempts.startedAt,
      gatherResult: wakeupAttempts.gatherResult,
    })
    .from(wakeupAttempts)
    .innerJoin(wakeups, eq(wakeupAttempts.wakeupId, wakeups.id))
    .where(
      and(
        eq(wakeups.userId, userId),
        eq(wakeupAttempts.gatherResult, "1"),
      ),
    );

  const confirmedDates = new Set<string>();

  for (const attempt of confirmedAttempts) {
    const timestamp = attempt.completedAt ?? attempt.startedAt;
    confirmedDates.add(toDateKey(timestamp, timezone));
  }

  const confirmedThisWeek = [...confirmedDates].filter((dateKey) => {
    const attemptDate = new Date(`${dateKey}T12:00:00`);
    return attemptDate >= weekStart;
  }).length;

  const sortedDates = [...confirmedDates].sort((a, b) => b.localeCompare(a));
  let currentStreak = 0;
  const todayKey = toDateKey(new Date(), timezone);
  const yesterdayKey = toDateKey(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    timezone,
  );

  if (sortedDates.length > 0) {
    const anchor =
      sortedDates[0] === todayKey
        ? todayKey
        : sortedDates[0] === yesterdayKey
          ? yesterdayKey
          : null;

    if (anchor) {
      let cursor = new Date(`${anchor}T12:00:00`);
      while (confirmedDates.has(toDateKey(cursor, timezone))) {
        currentStreak += 1;
        cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      }
    }
  }

  const [{ count: totalConfirmed }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(wakeupAttempts)
    .innerJoin(wakeups, eq(wakeupAttempts.wakeupId, wakeups.id))
    .where(
      and(
        eq(wakeups.userId, userId),
        eq(wakeupAttempts.gatherResult, "1"),
      ),
    );

  return {
    confirmedThisWeek,
    currentStreak,
    totalConfirmed,
  };
}
