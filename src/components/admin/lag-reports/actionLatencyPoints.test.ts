import { describe, expect, it } from "vitest";
import { buildActionLatencyPoints } from "./actionLatencyPoints";

const MATCH_START_MS = Date.parse("2026-09-20T18:00:00.000Z");

describe("buildActionLatencyPoints", () => {
  it("places each bucket at its wall-clock second after the match start", () => {
    const points = buildActionLatencyPoints(MATCH_START_MS, [10, 20, 30], [1, 1, 1]);

    expect(points.map((p) => p.x)).toEqual([MATCH_START_MS, MATCH_START_MS + 1000, MATCH_START_MS + 2000]);
    expect(points.map((p) => p.y)).toEqual([10, 20, 30]);
  });

  it("keeps points after a 65 s pause on wall-clock offsets and nulls the empty pause buckets", () => {
    // Game time freezes at 2000 ms during the pause, so gameTimeOffsetsMs would collapse the
    // pause buckets and shift later points early; the counts are 0 while nothing is echoed.
    const pauseSecs = 65;
    const counts = [1, 1, ...new Array<number>(pauseSecs).fill(0), 1, 1];
    const means = counts.map((c, i) => (c > 0 ? 40 + i : 0));

    const points = buildActionLatencyPoints(MATCH_START_MS, means, counts);

    const afterPause = 2 + pauseSecs;
    expect(points).toHaveLength(counts.length);
    expect(points[afterPause].x).toBe(MATCH_START_MS + afterPause * 1000);
    expect(points[afterPause + 1].x).toBe(MATCH_START_MS + (afterPause + 1) * 1000);
    expect(points.slice(2, afterPause).every((p) => p.y === null)).toBe(true);
    expect(points[afterPause].y).toBe(means[afterPause]);
  });

  it("keeps a zero mean as a value when samples were counted", () => {
    const points = buildActionLatencyPoints(MATCH_START_MS, [0], [3]);

    expect(points[0].y).toBe(0);
  });

  it("returns no points for no buckets", () => {
    expect(buildActionLatencyPoints(MATCH_START_MS, [], [])).toEqual([]);
  });
});
