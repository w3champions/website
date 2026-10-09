// Mirror of the GET /api/player-match-telemetry/by-game/{gameId} response shape.
// camelCase field names + plain typed arrays (backend decodes BinData on its side).

export type FloNodeTransport = "TCP" | "QUIC";

export interface IDisconnectEvent {
  startedAt: Date;
  durationMs: number;
}

export interface IActionLatencyAggregate {
  sampleCount: number;
  p10Ms: number;
  p50Ms: number;
  p99Ms: number;
  p999Ms: number;
  meanMs: number;
  stddevMs: number;
}

export interface IPlayerMatchTelemetryEntry {
  battleTag: string;
  connectionType: FloNodeTransport;
  gameLengthMs: number;
  crashedAt: Date | null;
  disconnectEvents: IDisconnectEvent[];
  actionLatencyAggregate: IActionLatencyAggregate;
  bucketCount: number;
  gameTimeOffsetsMs: number[];
  meansMs: number[];
  sampleCounts: number[];
  droppedUnmatchedCount: number;
  submittedAt: Date;
  // Optional: absent from older backends, null from older clients and launchers.
  transportStats?: ITransportStats | null;
  clientVersion?: string | null;
  launcherVersion?: string | null;
  routing?: IMatchTelemetryRouting | null;
}

/**
 * The client's own game-socket stats in 5 s wall-clock buckets: bucket i starts
 * i * 5 s after matchWallStart. The nullable arrays are absent when the client's
 * platform does not expose them (Windows: rttvar, lost; macOS: unacked; QUIC: rttvar, unacked).
 */
export interface ITransportStats {
  kind: FloNodeTransport;
  bucketCount: number;
  gameTimeOffsetsMs: number[];
  /** 1 Hz samples in the bucket; 0 means the client took none (a gap). */
  sampleCounts: number[];
  srttMaxMs: number[];
  rttvarMaxMs: number[] | null;
  /** null entries are QUIC buckets, which report no retransmits; null overall for an all-QUIC series. */
  retransDelta: (number | null)[] | null;
  lostMax: number[] | null;
  unackedMax: number[] | null;
  rxBytesDelta: number[];
  txBytesDelta: number[];
  /** Seconds the client waited beyond the usual node ping gap. */
  stallSecs: number[];
  /** Transport per bucket; absent or null from older clients, which report only `kind`. */
  kinds?: FloNodeTransport[] | null;
}

/** How the launcher routed the game, captured at game start. */
export interface IMatchTelemetryRouting {
  proxyName: string | null;
  proxyAddress: string | null;
  /** "direct" or "proxied"; a plain string so a new kind renders verbatim. */
  connectionKind: string | null;
}

export interface IPlayerMatchTelemetry {
  gameId: number;
  matchWallStart: Date;
  players: IPlayerMatchTelemetryEntry[];
  createdAt: Date;
  expiresAt: Date;
}
