export type ScheduleEvent = {
  id?: string;
  name: string;
  startsAt: Date;
  status: "final" | "upcoming" | "live" | "unknown";
  scoreLine?: string;
};

export function buildTeamSchedulePayload(input: {
  teamName: string;
  timezone: string;
  now: Date;
  events: ScheduleEvent[];
}): {
  headline: string;
  bullets: Array<{ label: string; value: string }>;
  notes: string[];
} {
  const { teamName, timezone, now, events } = input;
  const sorted = [...events].sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
  );

  const todayIso = getLocalDateIso(timezone, now);
  const startOfToday = localDateStart(todayIso, timezone);

  const todayGame = sorted.find((event) => {
    const eventDay = getLocalDateIso(timezone, event.startsAt);
    return (
      eventDay === todayIso &&
      (event.status === "upcoming" || event.status === "live")
    );
  });

  const nextGame = sorted.find(
    (event) =>
      event.startsAt >= startOfToday &&
      (event.status === "upcoming" || event.status === "live"),
  );

  const lastResult = [...sorted]
    .reverse()
    .find((event) => event.status === "final" && event.startsAt < now);

  const bullets: Array<{ label: string; value: string }> = [];
  const notes: string[] = [];

  if (todayGame) {
    bullets.push({
      label: "Today",
      value: formatScheduleEvent(todayGame, timezone, { includeDate: false }),
    });
  } else if (nextGame) {
    bullets.push({
      label: "Next up",
      value: formatScheduleEvent(nextGame, timezone, { includeDate: true }),
    });
    notes.push(`${teamName} have the day off today.`);
  } else {
    notes.push(`${teamName} have no upcoming games on the schedule right now.`);
  }

  if (lastResult?.scoreLine) {
    bullets.push({
      label: "Last game",
      value: `${lastResult.scoreLine} on ${formatFutureDate(getLocalDateIso(timezone, lastResult.startsAt), timezone)}`,
    });
  } else if (lastResult) {
    bullets.push({
      label: "Last game",
      value: `${lastResult.name} on ${formatFutureDate(getLocalDateIso(timezone, lastResult.startsAt), timezone)}`,
    });
  }

  return {
    headline: `${teamName} schedule`,
    bullets,
    notes,
  };
}

export function formatScheduleEvent(
  event: ScheduleEvent,
  timezone: string,
  options: { includeDate: boolean },
): string {
  const timeLabel = event.startsAt.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
  const dateLabel = formatFutureDate(
    getLocalDateIso(timezone, event.startsAt),
    timezone,
  );

  if (options.includeDate) {
    return `${event.name} on ${dateLabel} at ${timeLabel}`;
  }

  return `${event.name} at ${timeLabel}`;
}

function localDateStart(dateIso: string, timezone: string): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  }).formatToParts(utcGuess);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 12);
  return new Date(Date.UTC(year!, month! - 1, day!, 12 - hour, 0, 0));
}

export type TheSportsDbTeam = {
  idTeam?: string;
  strTeam?: string;
  strSport?: string;
  strLeague?: string;
};

export type TheSportsDbEvent = {
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  dateEvent?: string;
  strTime?: string;
  strLeague?: string;
  idEvent?: string;
};

export type TheSportsDbEventsResponse = {
  events?: TheSportsDbEvent[] | null;
  results?: TheSportsDbEvent[] | null;
};

export function teamMatchesQuery(query: string, teamName: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedTeam = teamName.trim().toLowerCase();

  if (!normalizedQuery || !normalizedTeam) {
    return false;
  }

  if (normalizedTeam === normalizedQuery) {
    return true;
  }

  if (
    normalizedTeam.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedTeam)
  ) {
    return true;
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const teamTokens = normalizedTeam.split(/\s+/).filter(Boolean);

  return queryTokens.every((token) =>
    teamTokens.some((teamToken) => teamToken.includes(token) || token.includes(teamToken)),
  );
}

export function getSportsDbApiKey(): string {
  return process.env.THE_SPORTS_DB_API_KEY?.trim() || "3";
}

export function pickBestTeamMatch(
  query: string,
  teams: TheSportsDbTeam[],
): TheSportsDbTeam | null {
  const normalizedQuery = query.trim().toLowerCase();
  if (teams.length === 0) {
    return null;
  }

  const exact = teams.find(
    (team) => team.strTeam?.trim().toLowerCase() === normalizedQuery,
  );
  if (exact?.idTeam) {
    return exact;
  }

  const startsWith = teams.find((team) =>
    team.strTeam?.trim().toLowerCase().startsWith(normalizedQuery),
  );
  if (startsWith?.idTeam) {
    return startsWith;
  }

  const soccer = teams.find(
    (team) =>
      team.idTeam &&
      team.strSport?.toLowerCase() === "soccer" &&
      team.strTeam?.toLowerCase().includes(normalizedQuery),
  );
  if (soccer?.idTeam) {
    return soccer;
  }

  return teams.find((team) => team.idTeam) ?? null;
}

export function getLocalDateIso(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatLocalTime(
  time: string | undefined,
  timezone: string,
): string | null {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatScore(event: TheSportsDbEvent): string {
  const home = event.strHomeTeam ?? "Home";
  const away = event.strAwayTeam ?? "Away";
  const homeScore = event.intHomeScore ?? "-";
  const awayScore = event.intAwayScore ?? "-";
  return `${away} ${awayScore}, ${home} ${homeScore}`;
}

export function formatUpcoming(event: TheSportsDbEvent, timezone: string): string {
  const matchup = event.strEvent ?? `${event.strAwayTeam} at ${event.strHomeTeam}`;
  const timeLabel = formatLocalTime(event.strTime, timezone);
  const league = event.strLeague ? ` (${event.strLeague})` : "";
  return timeLabel
    ? `${matchup} at ${timeLabel}${league}`
    : `${matchup}${league}`;
}

export function formatFutureDate(dateIso: string, timezone: string): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
  return date.toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function extractEvents(data: TheSportsDbEventsResponse | null): TheSportsDbEvent[] {
  return data?.events ?? data?.results ?? [];
}

export function parseSportsDbEvent(
  event: TheSportsDbEvent,
  timezone: string,
  options: { upcoming: boolean },
): ScheduleEvent | null {
  if (!event.strEvent && !(event.strHomeTeam && event.strAwayTeam)) {
    return null;
  }

  const name =
    event.strEvent ??
    `${event.strAwayTeam} at ${event.strHomeTeam}`;
  const datePart = event.dateEvent ?? "";
  const timePart = event.strTime ?? "12:00:00";
  const startsAt = new Date(`${datePart}T${timePart}`);

  if (Number.isNaN(startsAt.getTime())) {
    return null;
  }

  return {
    id: event.idEvent,
    name,
    startsAt,
    status: options.upcoming ? "upcoming" : "final",
    scoreLine: options.upcoming ? undefined : formatScore(event),
  };
}

export function scoreboardDateParam(timezone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}${month}${day}`;
}

export function dedupeScheduleEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const seen = new Set<string>();
  const deduped: ScheduleEvent[] = [];

  for (const event of events) {
    const key = event.id ?? `${event.name}-${event.startsAt.toISOString()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(event);
  }

  return deduped;
}
