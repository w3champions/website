// Synthetic reconstruction of the StarBuck report (flo game 13874560): a player relayed
// client → eu-south-west → brazil-north → brazil-north-2 felt 1–1.5 s echo-RTT spikes from
// 21:01:20 to 21:02:03 that came from the eu-south-west → brazil-north leg, and the opponent
// paused at 21:02:10 for 30 s.
import { EConnectionEventType, EConnectionType, type LagReportDetail, type LagReportPlayer, type RelayChain, type RelaySeries } from "@/store/admin/lagReports/types";
import type { IPlayerMatchTelemetry, ITransportStats } from "@/store/admin/playerMatchTelemetry/types";

export const MATCH_START_MS = Date.UTC(2026, 9, 8, 20, 45, 0);
export const MATCH_END_MS = Date.UTC(2026, 9, 8, 21, 5, 0);
export const SPIKE_FROM_MS = Date.UTC(2026, 9, 8, 21, 1, 20);
export const SPIKE_TO_MS = Date.UTC(2026, 9, 8, 21, 2, 3);
export const PAUSE_AT_MS = Date.UTC(2026, 9, 8, 21, 2, 10);
export const PAUSE_MS = 30_000;
const CONNECTED_MS = MATCH_START_MS - 2_000;
const BUCKET_SECS = 5;

type Sample = { srtt: number; stall?: number; retrans?: number };

function inSpike(t: number): boolean {
  return t + BUCKET_SECS * 1000 > SPIKE_FROM_MS && t <= SPIKE_TO_MS;
}

function makeSeries(role: string, sample: (bucketStartMs: number, i: number) => Sample): RelaySeries {
  const count = Math.ceil((MATCH_END_MS - CONNECTED_MS) / (BUCKET_SECS * 1000));
  const samples = Array.from({ length: count }, (_, i) => sample(CONNECTED_MS + i * BUCKET_SECS * 1000, i));
  return {
    role,
    kind: "tcp",
    firstSeenUnixMs: CONNECTED_MS,
    closedUnixMs: MATCH_END_MS,
    bucketsStartUnixMs: CONNECTED_MS,
    bucketSecs: BUCKET_SECS,
    bucketCount: count,
    buckets: {
      srttMaxMs: samples.map((s) => s.srtt),
      rttvarMaxMs: samples.map((s) => Math.round(s.srtt / 10)),
      retransDelta: samples.map((s) => s.retrans ?? 0),
      lostMax: samples.map(() => 0),
      unackedMax: samples.map(() => 1),
      rxBytesDelta: samples.map(() => 4_000),
      txBytesDelta: samples.map(() => 3_000),
      stallSecs: samples.map((s) => s.stall ?? 0),
    },
  };
}

const steady = (base: number) => (_t: number, i: number): Sample => ({ srtt: base + (i % 3) });

const relayLegSample = (t: number, i: number): Sample => inSpike(t) ? { srtt: 1000 + (i % 6) * 100, stall: 1 + (i % 2), retrans: 3 } : { srtt: 190 + (i % 4) };

export const starbuckRelayChain: RelayChain = {
  fetchedAt: "2026-10-08T21:05:30Z",
  connections: [
    {
      connectedUnixMs: CONNECTED_MS,
      legs: [
        {
          fromLabel: "client",
          toLabel: "eu-south-west",
          status: "measured",
          near: null,
          far: makeSeries("haproxy_fe", steady(24)),
          close: { fcRttMs: 25, fcRttvarMs: 3, fcRetrans: 0, fcLost: 0, bcRttMs: 196, term: "----", bytesIn: 4_800_000, bytesOut: 3_600_000, durationMs: MATCH_END_MS - CONNECTED_MS },
        },
        {
          fromLabel: "eu-south-west",
          toLabel: "brazil-north",
          status: "measured",
          near: makeSeries("haproxy_be", relayLegSample),
          far: makeSeries("haproxy_fe", relayLegSample),
          close: { fcRttMs: 196, fcRttvarMs: 40, fcRetrans: 27, fcLost: 0, bcRttMs: 5, term: "----", bytesIn: 4_800_000, bytesOut: 3_600_000, durationMs: MATCH_END_MS - CONNECTED_MS },
        },
        {
          fromLabel: "brazil-north",
          toLabel: "brazil-north-2",
          status: "measured",
          near: makeSeries("haproxy_be", steady(4)),
          far: makeSeries("node_player", steady(4)),
          close: null,
        },
      ],
    },
  ],
};

/** The client end of the first leg, as the flo client reports it in match telemetry. */
export const starbuckTransportStats: ITransportStats = (() => {
  const count = Math.ceil((MATCH_END_MS - MATCH_START_MS) / (BUCKET_SECS * 1000));
  const idx = Array.from({ length: count }, (_, i) => i);
  return {
    kind: "TCP",
    bucketCount: count,
    gameTimeOffsetsMs: idx.map((i) => i * BUCKET_SECS * 1000),
    sampleCounts: idx.map(() => 5),
    srttMaxMs: idx.map((i) => 22 + (i % 5)),
    rttvarMaxMs: null,
    retransDelta: idx.map(() => 0),
    lostMax: null,
    unackedMax: idx.map(() => 1),
    rxBytesDelta: idx.map(() => 3_500),
    txBytesDelta: idx.map(() => 3_000),
    stallSecs: idx.map(() => 0),
  };
})();

function feltEchoRtt(): { meansMs: number[]; sampleCounts: number[] } {
  const count = (MATCH_END_MS - MATCH_START_MS) / 1000;
  const meansMs: number[] = [];
  const sampleCounts: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = MATCH_START_MS + i * 1000;
    const paused = t >= PAUSE_AT_MS && t < PAUSE_AT_MS + PAUSE_MS;
    const spiking = t >= SPIKE_FROM_MS && t <= SPIKE_TO_MS;
    meansMs.push(spiking ? 1000 + (i % 6) * 90 : 230 + (i % 7));
    sampleCounts.push(paused ? 0 : 4);
  }
  return { meansMs, sampleCounts };
}

function player(battleTag: string, overrides: Partial<LagReportPlayer>): LagReportPlayer {
  return {
    battleTag,
    clientIp: null,
    connectionType: EConnectionType.Direct,
    proxyName: null,
    proxyIp: null,
    proxyPort: null,
    isExplicit: false,
    issueCategories: [],
    freeText: "",
    annotations: [],
    diagnostics: {
      lagEvents: [],
      targetMtr: [],
      allServerBaselines: [],
      reverseMtr: [],
      pingHistory: [],
      connectionEvents: [],
      hostStalls: [],
    },
    ...overrides,
  };
}

const pauseGameMs = PAUSE_AT_MS - MATCH_START_MS;

export const starbuckReport: LagReportDetail = {
  id: "1f0a6227-fixture",
  gameId: 13874560,
  floGameId: 13874560,
  gameName: "StarBuck fixture",
  mapPath: "Maps/frozenthrone/(2)ConcealedHill.w3x",
  serverNodeId: 42,
  serverNodeName: "brazil-north-2",
  hasExplicitReport: true,
  createdAt: "2026-10-08T21:03:00Z",
  updatedAt: "2026-10-08T21:05:30Z",
  serverSidePing: [
    {
      playerId: 1,
      playerName: "StarBuck#1234",
      samples: Array.from({ length: 120 }, (_, i) => ({ time: i * 10, min: 200, max: 240, avg: 215 + (i % 5) })),
    },
  ],
  players: [
    player("StarBuck#1234", {
      connectionType: EConnectionType.Proxied,
      proxyName: "eu-south-west",
      isExplicit: true,
      floPlayerId: 7,
      relayChain: starbuckRelayChain,
      diagnostics: {
        lagEvents: [{ timestamp: new Date(SPIKE_FROM_MS + 10_000).toISOString(), gameTimeOffsetMs: SPIKE_FROM_MS + 10_000 - MATCH_START_MS, annotation: null }],
        targetMtr: [],
        allServerBaselines: [],
        reverseMtr: [],
        pingHistory: [],
        connectionEvents: [],
        hostStalls: [],
      },
    }),
    player("Opponent#5678", {
      floPlayerId: 8,
      relayChain: null,
      diagnostics: {
        lagEvents: [],
        targetMtr: [],
        allServerBaselines: [],
        reverseMtr: [],
        pingHistory: [],
        connectionEvents: [
          { timestamp: new Date(PAUSE_AT_MS).toISOString(), gameTimeOffsetMs: pauseGameMs, eventType: EConnectionEventType.GamePaused, durationMs: null },
          { timestamp: new Date(PAUSE_AT_MS + PAUSE_MS).toISOString(), gameTimeOffsetMs: pauseGameMs, eventType: EConnectionEventType.GameResumed, durationMs: PAUSE_MS },
        ],
        hostStalls: [],
      },
    }),
  ],
};

export const starbuckTelemetry: IPlayerMatchTelemetry = {
  gameId: 13874560,
  matchWallStart: new Date(MATCH_START_MS),
  createdAt: new Date(MATCH_END_MS),
  expiresAt: new Date(MATCH_END_MS + 86_400_000),
  players: [
    {
      battleTag: "StarBuck#1234",
      connectionType: "TCP",
      gameLengthMs: MATCH_END_MS - MATCH_START_MS,
      crashedAt: null,
      disconnectEvents: [],
      actionLatencyAggregate: { sampleCount: 4800, p10Ms: 228, p50Ms: 233, p99Ms: 1400, p999Ms: 1500, meanMs: 260, stddevMs: 150 },
      bucketCount: (MATCH_END_MS - MATCH_START_MS) / 1000,
      gameTimeOffsetsMs: [],
      ...feltEchoRtt(),
      droppedUnmatchedCount: 0,
      submittedAt: new Date(MATCH_END_MS),
      transportStats: starbuckTransportStats,
    },
  ],
};
