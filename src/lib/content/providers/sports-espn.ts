import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import { createFallbackPayload } from "@/lib/content/types";
import {
  buildTeamSchedulePayload,
  dedupeScheduleEvents,
  getLocalDateIso,
  scoreboardDateParam,
  type ScheduleEvent,
} from "@/lib/content/providers/sports-utils";

type EspnSearchItem = {
  id?: string;
  displayName?: string;
  name?: string;
  sport?: string;
  league?: string;
  type?: string;
};

type EspnSearchResponse = {
  items?: EspnSearchItem[];
};

type EspnCompetitor = {
  homeAway?: string;
  team?: { id?: string; displayName?: string };
  score?: { displayValue?: string };
};

type EspnEvent = {
  id?: string;
  name?: string;
  date?: string;
  competitions?: Array<{
    status?: { type?: { name?: string; description?: string } };
    competitors?: EspnCompetitor[];
  }>;
};

type EspnScheduleResponse = {
  events?: EspnEvent[];
};

function mapEspnStatus(statusName: string | undefined): ScheduleEvent["status"] {
  if (!statusName) {
    return "unknown";
  }
  if (statusName === "STATUS_FINAL" || statusName === "STATUS_FULL_TIME") {
    return "final";
  }
  if (
    statusName.startsWith("STATUS_SCHEDULED") ||
    statusName === "STATUS_PREGAME"
  ) {
    return "upcoming";
  }
  if (
    statusName === "STATUS_IN_PROGRESS" ||
    statusName.startsWith("STATUS_HALFTIME") ||
    statusName.startsWith("STATUS_END_PERIOD")
  ) {
    return "live";
  }
  return "unknown";
}

function formatEspnScore(event: EspnEvent): string {
  const competitors = event.competitions?.[0]?.competitors ?? [];
  const away = competitors.find((team) => team.homeAway === "away");
  const home = competitors.find((team) => team.homeAway === "home");
  const awayName = away?.team?.displayName ?? "Away";
  const homeName = home?.team?.displayName ?? "Home";
  const awayScore = away?.score?.displayValue ?? "-";
  const homeScore = home?.score?.displayValue ?? "-";
  return `${awayName} ${awayScore}, ${homeName} ${homeScore}`;
}

function mapEspnEvent(event: EspnEvent): ScheduleEvent | null {
  if (!event.name || !event.date) {
    return null;
  }

  const startsAt = new Date(event.date);
  if (Number.isNaN(startsAt.getTime())) {
    return null;
  }

  const status = mapEspnStatus(event.competitions?.[0]?.status?.type?.name);
  return {
    id: event.id,
    name: event.name,
    startsAt,
    status,
    scoreLine: status === "final" ? formatEspnScore(event) : undefined,
  };
}

function eventIncludesTeam(event: EspnEvent, teamId: string): boolean {
  const competitors = event.competitions?.[0]?.competitors ?? [];
  return competitors.some((team) => team.team?.id === teamId);
}

async function fetchEspnJson<T>(url: URL): Promise<T | null> {
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T;
}

async function fetchEspnTeamEvents(input: {
  sport: string;
  league: string;
  teamId: string;
  timezone: string;
  now: Date;
}): Promise<ScheduleEvent[]> {
  const year = Number(getLocalDateIso(input.timezone, input.now).slice(0, 4));
  const scheduleUrls = [
    new URL(
      `https://site.api.espn.com/apis/site/v2/sports/${input.sport}/${input.league}/teams/${input.teamId}/schedule`,
    ),
    new URL(
      `https://site.api.espn.com/apis/site/v2/sports/${input.sport}/${input.league}/teams/${input.teamId}/schedule?seasontype=2&season=${year}`,
    ),
    new URL(
      `https://site.api.espn.com/apis/site/v2/sports/${input.sport}/${input.league}/teams/${input.teamId}/schedule?seasontype=3&season=${year}`,
    ),
    new URL(
      `https://site.api.espn.com/apis/site/v2/sports/${input.sport}/${input.league}/scoreboard?dates=${scoreboardDateParam(input.timezone, input.now)}`,
    ),
  ];

  const responses = await Promise.all(
    scheduleUrls.map((url) => fetchEspnJson<EspnScheduleResponse>(url)),
  );

  const events: ScheduleEvent[] = [];
  for (const [index, response] of responses.entries()) {
    const rawEvents = response?.events ?? [];
    for (const rawEvent of rawEvents) {
      if (index === scheduleUrls.length - 1 && !eventIncludesTeam(rawEvent, input.teamId)) {
        continue;
      }
      const mapped = mapEspnEvent(rawEvent);
      if (mapped) {
        events.push(mapped);
      }
    }
  }

  return dedupeScheduleEvents(events);
}

export async function fetchEspnSportsContent(
  context: ContentFetchContext,
): Promise<ContentPayload | null> {
  const teamQuery = context.favoriteTeam?.trim();
  if (!teamQuery) {
    return null;
  }

  const searchUrl = new URL("https://site.api.espn.com/apis/common/v3/search");
  searchUrl.searchParams.set("query", teamQuery);
  searchUrl.searchParams.set("type", "team");
  searchUrl.searchParams.set("limit", "5");

  const searchData = await fetchEspnJson<EspnSearchResponse>(searchUrl);
  const match = (searchData?.items ?? []).find(
    (item) =>
      item.type === "team" &&
      item.id &&
      item.sport &&
      item.league &&
      item.displayName,
  );

  if (!match?.id || !match.sport || !match.league || !match.displayName) {
    return null;
  }

  const timezone = context.timezone || "America/Toronto";
  const now = context.now ?? new Date();
  const events = await fetchEspnTeamEvents({
    sport: match.sport,
    league: match.league,
    teamId: match.id,
    timezone,
    now,
  });

  if (events.length === 0) {
    return null;
  }

  const schedule = buildTeamSchedulePayload({
    teamName: match.displayName,
    timezone,
    now,
    events,
  });

  if (schedule.bullets.length === 0 && schedule.notes.length === 0) {
    return null;
  }

  return {
    mode: "sports_scores",
    headline: schedule.headline,
    bullets: schedule.bullets,
    notes: schedule.notes,
    source: "api",
  };
}
