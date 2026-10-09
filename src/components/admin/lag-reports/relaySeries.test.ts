import { describe, expect, it } from "vitest";
import type { RelaySeries } from "@/store/admin/lagReports/types";
import type { ITransportStats } from "@/store/admin/playerMatchTelemetry/types";
import { clientTransportSeries, seriesHighlight, seriesSrttPoints, seriesStats, sliceSeries } from "./relaySeries";

const START = Date.UTC(2026, 9, 8, 21, 0, 0);

function series(columns: Partial<RelaySeries["buckets"]>, overrides: Partial<RelaySeries> = {}): RelaySeries {
  const n = columns.srttMaxMs?.length ?? 0;
  const fill = <T>(v: T) => Array.from({ length: n }, () => v);
  return {
    role: "haproxy_fe",
    kind: "tcp",
    firstSeenUnixMs: START,
    closedUnixMs: 0,
    bucketsStartUnixMs: START,
    bucketSecs: 5,
    bucketCount: n,
    buckets: {
      srttMaxMs: fill(null),
      rttvarMaxMs: fill(null),
      retransDelta: fill(0),
      lostMax: fill(null),
      unackedMax: fill(null),
      rxBytesDelta: fill(100),
      txBytesDelta: fill(100),
      stallSecs: fill(0),
      ...columns,
    },
    ...overrides,
  };
}

describe("seriesSrttPoints", () => {
  it("places bucket i at bucketsStartUnixMs + i * bucketSecs * 1000", () => {
    const points = seriesSrttPoints(series({ srttMaxMs: [40, 41, 42] }));

    expect(points).toEqual([
      { x: START, y: 40 },
      { x: START + 5_000, y: 41 },
      { x: START + 10_000, y: 42 },
    ]);
  });

  it("honours a downsampled bucket width", () => {
    const points = seriesSrttPoints(series({ srttMaxMs: [40, 41] }, { bucketSecs: 10 }));

    expect(points[1].x).toBe(START + 10_000);
  });

  it("keeps a null bucket as a gap instead of dropping or zeroing it", () => {
    const points = seriesSrttPoints(series({ srttMaxMs: [40, null, 42] }));

    expect(points).toHaveLength(3);
    expect(points[1]).toEqual({ x: START + 5_000, y: null });
  });

  it("returns no points for an empty series", () => {
    expect(seriesSrttPoints(series({ srttMaxMs: [] }))).toEqual([]);
  });
});

describe("seriesHighlight", () => {
  it("steps stall seconds across each bucket and closes the last bucket at its end", () => {
    const h = seriesHighlight(series({ srttMaxMs: [40, 1200, 40], stallSecs: [0, 2, 0] }));

    expect(h.stallSteps).toEqual([
      { x: START, y: 0 },
      { x: START + 5_000, y: 2 },
      { x: START + 10_000, y: 0 },
      { x: START + 15_000, y: 0 },
    ]);
    expect(h.hasStall).toBe(true);
  });

  it("keeps a sampler gap as a gap in the stall steps", () => {
    const h = seriesHighlight(series({ srttMaxMs: [40, null], stallSecs: [1, null] }));

    expect(h.stallSteps.map((p) => p.y)).toEqual([1, null, null]);
  });

  it("flags only the buckets that retransmitted", () => {
    const h = seriesHighlight(series({ srttMaxMs: [40, 900, 40], retransDelta: [0, 3, null] }));

    expect(h.retransmitAt).toEqual([false, true, false]);
  });

  it("reports no stall for a clean series", () => {
    const h = seriesHighlight(series({ srttMaxMs: [40, 41] }));

    expect(h.hasStall).toBe(false);
    expect(h.retransmitAt).toEqual([false, false]);
  });

  it("returns empty highlights for an empty series", () => {
    expect(seriesHighlight(series({ srttMaxMs: [] }))).toEqual({ stallSteps: [], retransmitAt: [], hasStall: false });
  });
});

describe("seriesStats", () => {
  it("summarises srtt percentiles, maxima and totals, ignoring gaps", () => {
    const stats = seriesStats(series({
      srttMaxMs: [40, 50, null, 60, 1500],
      rttvarMaxMs: [2, 9, null, 3, 400],
      retransDelta: [0, 1, null, 0, 4],
      lostMax: [0, 0, null, 2, 1],
      stallSecs: [0, 0, null, 1, 2],
    }));

    expect(stats).toEqual({
      bucketsWithData: 4,
      srttP10Ms: 40,
      srttP50Ms: 50,
      srttMaxMs: 1500,
      srttJumpMs: 1460,
      rttvarMaxMs: 400,
      retransTotal: 5,
      lostMax: 2,
      stallSecsTotal: 3,
    });
  });

  it("returns nulls for fields the transport never exposed", () => {
    const stats = seriesStats(series({ srttMaxMs: [40, 41] }));

    expect(stats.rttvarMaxMs).toBeNull();
    expect(stats.lostMax).toBeNull();
  });

  it("returns all nulls for a series without data", () => {
    const stats = seriesStats(series({ srttMaxMs: [null] }, {}));

    expect(stats.bucketsWithData).toBe(0);
    expect(stats.srttMaxMs).toBeNull();
    expect(stats.srttJumpMs).toBeNull();
  });
});

describe("clientTransportSeries", () => {
  function transport(overrides: Partial<ITransportStats> = {}): ITransportStats {
    return {
      kind: "TCP",
      bucketCount: 3,
      gameTimeOffsetsMs: [0, 5_000, 5_000],
      sampleCounts: [5, 5, 0],
      srttMaxMs: [30, 35, 0],
      rttvarMaxMs: null,
      retransDelta: [0, 2, 0],
      lostMax: null,
      unackedMax: [1, 1, 0],
      rxBytesDelta: [10, 10, 0],
      txBytesDelta: [10, 10, 0],
      stallSecs: [0, 1, 0],
      ...overrides,
    };
  }

  it("anchors 5 s wall-clock buckets at matchWallStart, not at the game-time offsets", () => {
    const s = clientTransportSeries(transport(), START);

    expect(s.bucketsStartUnixMs).toBe(START);
    expect(s.bucketSecs).toBe(5);
    expect(seriesSrttPoints(s).map((p) => p.x)).toEqual([START, START + 5_000, START + 10_000]);
  });

  it("turns buckets without samples into gaps and absent arrays into nulls", () => {
    const s = clientTransportSeries(transport(), START);

    expect(s.buckets.srttMaxMs).toEqual([30, 35, null]);
    expect(s.buckets.stallSecs).toEqual([0, 1, null]);
    expect(s.buckets.rttvarMaxMs).toEqual([null, null, null]);
    expect(s.buckets.unackedMax).toEqual([1, 1, null]);
  });

  it("labels the series as the client end and lower-cases the transport", () => {
    const s = clientTransportSeries(transport({ kind: "QUIC" }), START);

    expect(s.role).toBe("client");
    expect(s.kind).toBe("quic");
  });
});

describe("sliceSeries", () => {
  it("keeps the buckets that start inside the window and re-anchors the start", () => {
    const s = series({ srttMaxMs: [1, 2, 3, 4], stallSecs: [0, 1, 0, 1] });

    const sliced = sliceSeries(s, START + 5_000, START + 15_000);

    expect(sliced.bucketsStartUnixMs).toBe(START + 5_000);
    expect(sliced.bucketCount).toBe(2);
    expect(sliced.buckets.srttMaxMs).toEqual([2, 3]);
    expect(sliced.buckets.stallSecs).toEqual([1, 0]);
  });

  it("gives the bucket a connection started in to that connection, so no start-up data is lost", () => {
    const s = series({ srttMaxMs: [1, 2, 3, 4] });

    const before = sliceSeries(s, START, START + 7_000);
    const after = sliceSeries(s, START + 7_000, Infinity);

    expect(before.buckets.srttMaxMs).toEqual([1]);
    expect(after.buckets.srttMaxMs).toEqual([2, 3, 4]);
    expect(after.bucketsStartUnixMs).toBe(START + 5_000);
  });

  it("returns an empty series when the window misses every bucket", () => {
    const sliced = sliceSeries(series({ srttMaxMs: [1, 2] }), START + 60_000, START + 70_000);

    expect(sliced.bucketCount).toBe(0);
    expect(sliced.buckets.srttMaxMs).toEqual([]);
  });

  it("does not modify the input series", () => {
    const s = series({ srttMaxMs: [1, 2, 3] });

    sliceSeries(s, START + 5_000, START + 10_000);

    expect(s.buckets.srttMaxMs).toEqual([1, 2, 3]);
    expect(s.bucketsStartUnixMs).toBe(START);
  });
});
