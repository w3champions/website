import type { IBinData } from "./binDataDecoder";

export interface IDisconnectStats {
  count: number;
  totalDurationMs: number;
  meanDurationMs: number;
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
  floPlayerId: number;
  connectionType: string; // "TCP" | "QUIC"
  serverNodeId: number | null;
  serverNodeName: string | null;
  gameLengthMs: number;
  crashed: boolean;
  disconnects: IDisconnectStats;
  actionLatencyAggregate: IActionLatencyAggregate;
  bucketCount: number;
  gameTimeOffsetsMs: IBinData; // u32 LE packed
  meansMs: IBinData; // u16 LE packed
  sampleCounts: IBinData; // u8 packed
  droppedUnmatchedCount: number;
  submittedAt: string; // ISO 8601
}

export interface IPlayerMatchTelemetry {
  gameId: number;
  matchWallStart: string; // ISO 8601
  bucketMs: number;
  players: IPlayerMatchTelemetryEntry[];
  createdAt: string;
  expiresAt: string;
}
