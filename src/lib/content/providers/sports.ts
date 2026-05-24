import type { ContentFetchContext, ContentPayload } from "@/lib/content/types";
import { createFallbackPayload } from "@/lib/content/types";
import { fetchEspnSportsContent } from "@/lib/content/providers/sports-espn";
import {
  buildTeamSchedulePayload,
  extractEvents,
  getSportsDbApiKey,
  parseSportsDbEvent,
  pickBestTeamMatch,
  teamMatchesQuery,
  type TheSportsDbEventsResponse,
  type TheSportsDbTeam,
} from "@/lib/content/providers/sports-utils";

async function fetchSportsDbJson<T>(url: URL): Promise<T | null> {
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as T;
}

function sportsDbUrl(path: string): URL {
  const url = new URL(
    `https://www.thesportsdb.com/api/v1/json/${getSportsDbApiKey()}/${path}`,
  );
  return url;
}

async function fetchTheSportsDbContent(
  context: ContentFetchContext,
): Promise<ContentPayload | null> {
  const team = context.favoriteTeam?.trim();
  if (!team) {
    return null;
  }

  const searchUrl = sportsDbUrl("searchteams.php");
  searchUrl.searchParams.set("t", team);

  const searchData = await fetchSportsDbJson<{ teams?: TheSportsDbTeam[] | null }>(
    searchUrl,
  );
  const matchedTeam = pickBestTeamMatch(team, searchData?.teams ?? []);
  const teamName = matchedTeam?.strTeam ?? "";

  if (!matchedTeam?.idTeam || !teamMatchesQuery(team, teamName)) {
    return null;
  }

  const timezone = context.timezone || "America/Toronto";
  const now = context.now ?? new Date();

  const [lastData, nextData] = await Promise.all([
    fetchSportsDbJson<TheSportsDbEventsResponse>(
      sportsDbUrl(`eventslast.php?id=${matchedTeam.idTeam}`),
    ),
    fetchSportsDbJson<TheSportsDbEventsResponse>(
      sportsDbUrl(`eventsnext.php?id=${matchedTeam.idTeam}`),
    ),
  ]);

  const events = [
    ...extractEvents(nextData)
      .map((event) => parseSportsDbEvent(event, timezone, { upcoming: true }))
      .filter((event): event is NonNullable<typeof event> => event !== null),
    ...extractEvents(lastData)
      .map((event) => parseSportsDbEvent(event, timezone, { upcoming: false }))
      .filter((event): event is NonNullable<typeof event> => event !== null),
  ];

  if (events.length === 0) {
    return null;
  }

  const schedule = buildTeamSchedulePayload({
    teamName,
    timezone,
    now,
    events,
  });

  return {
    mode: "sports_scores",
    headline: schedule.headline,
    bullets: schedule.bullets,
    notes: schedule.notes,
    source: "api",
  };
}

export async function fetchSportsContent(
  context: ContentFetchContext,
): Promise<ContentPayload> {
  const team = context.favoriteTeam?.trim();
  if (!team) {
    return createFallbackPayload(
      context,
      "Add your favorite team to get sports updates in your wake-up.",
    );
  }

  try {
    const espnPayload = await fetchEspnSportsContent(context);
    if (espnPayload) {
      return espnPayload;
    }

    const sportsDbPayload = await fetchTheSportsDbContent(context);
    if (sportsDbPayload) {
      return sportsDbPayload;
    }

    return createFallbackPayload(
      context,
      `Could not find schedule data for ${team}. Try the full team name, like Toronto Raptors or Calgary Flames.`,
    );
  } catch {
    return createFallbackPayload(context, `Could not load sports schedule for ${team}.`);
  }
}

export { pickBestTeamMatch, teamMatchesQuery } from "@/lib/content/providers/sports-utils";
