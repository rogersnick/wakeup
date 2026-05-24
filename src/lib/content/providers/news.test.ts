import { describe, expect, it } from "vitest";
import {
  buildNewsSearchQuery,
  cleanGoogleNewsTitle,
  parseRssItemTitles,
} from "@/lib/content/providers/news-google";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Forever Canadian begins its campaign ahead of Alberta separation referendum - CityNews Calgary</title>
    </item>
    <item>
      <title><![CDATA[Smith says Alberta separatists should focus on fall vote rather than ousting her - Calgary Journal]]></title>
    </item>
  </channel>
</rss>`;

describe("buildNewsSearchQuery", () => {
  it("uses city and region from a full label", () => {
    expect(buildNewsSearchQuery("Calgary, Alberta, Canada")).toBe(
      "Calgary Alberta",
    );
  });
});

describe("cleanGoogleNewsTitle", () => {
  it("removes the trailing source name", () => {
    expect(
      cleanGoogleNewsTitle(
        "Forever Canadian begins its campaign ahead of Alberta separation referendum - CityNews Calgary",
      ),
    ).toBe(
      "Forever Canadian begins its campaign ahead of Alberta separation referendum",
    );
  });
});

describe("parseRssItemTitles", () => {
  it("extracts cleaned headlines from RSS items", () => {
    expect(parseRssItemTitles(SAMPLE_RSS, 2)).toEqual([
      "Forever Canadian begins its campaign ahead of Alberta separation referendum",
      "Smith says Alberta separatists should focus on fall vote rather than ousting her",
    ]);
  });
});
