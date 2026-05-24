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
}

export interface IPlayerMatchTelemetry {
  gameId: number;
  matchWallStart: Date;
  players: IPlayerMatchTelemetryEntry[];
  createdAt: Date;
  expiresAt: Date;
}
