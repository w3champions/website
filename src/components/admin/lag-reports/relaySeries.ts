import type { RelayBucketColumns, RelaySeries } from "@/store/admin/lagReports/types";
import type { ITransportStats } from "@/store/admin/playerMatchTelemetry/types";

export interface ChartPoint {
  x: number;
  y: number | null;
}

export interface SeriesHighlight {
  /** One point per bucket start plus one at the end of the last bucket, for a stepped fill. */
  stallSteps: ChartPoint[];
  retransmitAt: boolean[];
  hasStall: boolean;
}

export interface SeriesStats {
  bucketsWithData: number;
  srttP10Ms: number | null;
  srttP50Ms: number | null;
  srttMaxMs: number | null;
  /** Max srtt over the series' own p10: a steady long path scores low, a spike scores high. */
  srttJumpMs: number | null;
  rttvarMaxMs: number | null;
  retransTotal: number | null;
  lostMax: number | null;
  stallSecsTotal: number | null;
}

// Mirrors TRANSPORT_STATS_BUCKET_MS in flo's crates/client/src/match_telemetry/constants.rs.
const CLIENT_BUCKET_SECS = 5;

function bucketMs(series: RelaySeries): number {
  return series.bucketSecs * 1000;
}

function bucketCount(series: RelaySeries): number {
  return series.buckets.srttMaxMs.length;
}

export function seriesSrttPoints(series: RelaySeries): ChartPoint[] {
  const width = bucketMs(series);
  return series.buckets.srttMaxMs.map((y, i) => ({ x: series.bucketsStartUnixMs + i * width, y }));
}

export function seriesHighlight(series: RelaySeries): SeriesHighlight {
  const n = bucketCount(series);
  if (n === 0) return { stallSteps: [], retransmitAt: [], hasStall: false };

  const width = bucketMs(series);
  const stall = series.buckets.stallSecs;
  const stallSteps = stall.map((y, i) => ({ x: series.bucketsStartUnixMs + i * width, y: y ?? null }));
  stallSteps.push({ x: series.bucketsStartUnixMs + n * width, y: stall[n - 1] ?? null });

  return {
    stallSteps,
    retransmitAt: series.buckets.retransDelta.map((r) => (r ?? 0) > 0),
    hasStall: stall.some((s) => (s ?? 0) > 0),
  };
}

function present(values: (number | null)[]): number[] {
  return values.filter((v): v is number => v != null);
}

/** Nearest-rank percentile of an ascending array. */
function percentile(sorted: number[], q: number): number {
  return sorted[Math.max(0, Math.ceil(q * sorted.length) - 1)];
}

function maxOrNull(values: number[]): number | null {
  return values.length ? Math.max(...values) : null;
}

function sumOrNull(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) : null;
}

export function seriesStats(series: RelaySeries): SeriesStats {
  const srtt = present(series.buckets.srttMaxMs).sort((a, b) => a - b);
  const p10 = srtt.length ? percentile(srtt, 0.1) : null;
  const max = maxOrNull(srtt);
  return {
    bucketsWithData: srtt.length,
    srttP10Ms: p10,
    srttP50Ms: srtt.length ? percentile(srtt, 0.5) : null,
    srttMaxMs: max,
    srttJumpMs: max != null && p10 != null ? max - p10 : null,
    rttvarMaxMs: maxOrNull(present(series.buckets.rttvarMaxMs)),
    retransTotal: sumOrNull(present(series.buckets.retransDelta)),
    lostMax: maxOrNull(present(series.buckets.lostMax)),
    stallSecsTotal: sumOrNull(present(series.buckets.stallSecs)),
  };
}

/**
 * The client's own socket stats in the relay series shape, so the first leg's client end
 * goes through the same transforms as the node-measured ends. A bucket without samples is a
 * gap, not a zero: the client was not connected or not sampling then.
 */
export function clientTransportSeries(ts: ITransportStats, matchWallStartMs: number): RelaySeries {
  const sampled = (i: number) => (ts.sampleCounts[i] ?? 0) > 0;
  const column = (values: number[] | null | undefined): (number | null)[] => ts.srttMaxMs.map((_, i) => (values && sampled(i) ? values[i] ?? null : null));

  return {
    role: "client",
    kind: ts.kind.toLowerCase(),
    firstSeenUnixMs: matchWallStartMs,
    closedUnixMs: 0,
    bucketsStartUnixMs: matchWallStartMs,
    bucketSecs: CLIENT_BUCKET_SECS,
    bucketCount: ts.srttMaxMs.length,
    buckets: {
      srttMaxMs: column(ts.srttMaxMs),
      rttvarMaxMs: column(ts.rttvarMaxMs),
      retransDelta: column(ts.retransDelta),
      lostMax: column(ts.lostMax),
      unackedMax: column(ts.unackedMax),
      rxBytesDelta: column(ts.rxBytesDelta),
      txBytesDelta: column(ts.txBytesDelta),
      stallSecs: column(ts.stallSecs),
    },
  };
}

/**
 * The buckets from the one containing fromMs up to, not including, the one containing toMs.
 * Consecutive windows therefore never share or drop a bucket, and a connection keeps the bucket
 * it started in.
 */
export function sliceSeries(series: RelaySeries, fromMs: number, toMs: number): RelaySeries {
  const width = bucketMs(series);
  const first = Math.max(0, Math.floor((fromMs - series.bucketsStartUnixMs) / width));
  const end = Math.min(bucketCount(series), Math.floor((toMs - series.bucketsStartUnixMs) / width));
  const count = Math.max(0, end - first);
  const pick = (column: keyof RelayBucketColumns) => series.buckets[column].slice(first, first + count);
  const buckets: RelayBucketColumns = {
    srttMaxMs: pick("srttMaxMs"),
    rttvarMaxMs: pick("rttvarMaxMs"),
    retransDelta: pick("retransDelta"),
    lostMax: pick("lostMax"),
    unackedMax: pick("unackedMax"),
    rxBytesDelta: pick("rxBytesDelta"),
    txBytesDelta: pick("txBytesDelta"),
    stallSecs: pick("stallSecs"),
  };

  return {
    ...series,
    bucketsStartUnixMs: series.bucketsStartUnixMs + first * width,
    bucketCount: count,
    buckets,
  };
}
