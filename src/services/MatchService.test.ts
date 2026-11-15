import { afterEach, describe, expect, it, vi } from "vitest";
import MatchService from "./MatchService";
import { EGameMode } from "@/store/types";

vi.mock("@/config/env", () => ({ API_URL: "https://api.example.com/" }));

afterEach(() => {
  vi.unstubAllGlobals();
});

function captureFetch(): string[] {
  const urls: string[] = [];
  vi.stubGlobal("fetch", (input: string) => {
    urls.push(input);
    return Promise.resolve(new Response(JSON.stringify({ count: 0, matches: [] })));
  });
  return urls;
}

const allMmr = { min: 0, max: 3000 };
const duration = { min: 0, max: 14400 };

describe("MatchService map filters", () => {
  it("filters ongoing matches by encoded map name, not by map file", async () => {
    const urls = captureFetch();

    await MatchService.retrieveOnGoingMatches(0, 50, 20, EGameMode.GM_1ON1, "Bandit's Retreat & Co", allMmr, duration, "startTimeDescending");

    const query = new URL(urls[0]).searchParams;
    expect(query.get("mapName")).toBe("Bandit's Retreat & Co");
    expect(query.has("map")).toBe(false);
    expect(query.get("sort")).toBe("startTimeDescending");
  });

  it("keeps the all-maps value for ongoing matches", async () => {
    const urls = captureFetch();

    await MatchService.retrieveOnGoingMatchesPaged(1, 20, EGameMode.GM_1ON1, "Overall", allMmr, duration, "startTimeDescending");

    const query = new URL(urls[0]).searchParams;
    expect(query.get("mapName")).toBe("Overall");
    expect(query.get("offset")).toBe("50");
  });

  it("encodes the map name of finished matches", async () => {
    const urls = captureFetch();

    await MatchService.retrieveMatches(0, 20, EGameMode.GM_1ON1, "Echo Isles v2 #1+2", allMmr, duration, 25, []);

    const query = new URL(urls[0]).searchParams;
    expect(query.get("mapName")).toBe("Echo Isles v2 #1+2");
    expect(query.get("season")).toBe("25");
  });
});
