import { describe, expect, it } from "vitest";
import {
  buildTeamSchedulePayload,
  extractEvents,
  pickBestTeamMatch,
  teamMatchesQuery,
} from "@/lib/content/providers/sports-utils";

describe("pickBestTeamMatch", () => {
  it("prefers exact team name matches", () => {
    const match = pickBestTeamMatch("Arsenal", [
      { idTeam: "1", strTeam: "Arsenal Tula", strSport: "Soccer" },
      {
        idTeam: "2",
        strTeam: "Arsenal",
        strSport: "Soccer",
        strLeague: "English Premier League",
      },
    ]);

    expect(match?.idTeam).toBe("2");
  });
});

describe("teamMatchesQuery", () => {
  it("rejects unrelated team matches", () => {
    expect(teamMatchesQuery("Raptors", "Arsenal")).toBe(false);
  });

  it("accepts nickname matches", () => {
    expect(teamMatchesQuery("Raptors", "Toronto Raptors")).toBe(true);
  });
});

describe("buildTeamSchedulePayload", () => {
  it("prioritizes the next upcoming game", () => {
    const schedule = buildTeamSchedulePayload({
      teamName: "Toronto Raptors",
      timezone: "America/Toronto",
      now: new Date("2026-05-24T12:00:00-04:00"),
      events: [
        {
          name: "Toronto Raptors at Boston Celtics",
          startsAt: new Date("2026-05-26T19:30:00-04:00"),
          status: "upcoming",
        },
        {
          name: "Toronto Raptors at Cleveland Cavaliers",
          startsAt: new Date("2026-05-03T19:00:00-04:00"),
          status: "final",
          scoreLine: "Toronto Raptors 102, Cleveland Cavaliers 114",
        },
      ],
    });

    expect(schedule.bullets[0]?.label).toBe("Next up");
    expect(schedule.bullets[0]?.value).toContain("Boston Celtics");
    expect(schedule.bullets.some((bullet) => bullet.label === "Last game")).toBe(true);
  });
});

describe("extractEvents", () => {
  it("reads results from eventslast responses", () => {
    const events = extractEvents({
      results: [{ strHomeTeam: "Arsenal", strAwayTeam: "Burnley" }],
    });

    expect(events).toHaveLength(1);
  });
});
