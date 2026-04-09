export type LagReportsState = {
  reports: LagReportListItem[];
  total: number;
  loading: boolean;
  selectedReport: LagReportDetail | null;
  selectedReportLoading: boolean;
};

export interface LagReportListItem {
  id: string;
  gameId: number;
  floGameId: number;
  gameName: string;
  mapPath: string;
  serverNodeId: number;
  serverNodeName: string;
  createdAt: string;
  hasExplicitReport: boolean;
  players: LagReportPlayerSummary[];
}

export interface LagReportPlayerSummary {
  battleTag: string;
  isExplicit: boolean;
  connectionType: string;
  proxyName: string | null;
  issueCategories: string[];
  lagEventCount: number;
  connectionEventCount: number;
}

export interface LagReportsResponse {
  items: LagReportListItem[];
  total: number;
}

export interface LagReportQueryParams {
  page: number;
  pageSize: number;
  battleTag?: string;
  gameId?: number;
  serverNodeId?: number;
  proxyName?: string;
  proxyIp?: string;
  dateFrom?: string;
  dateTo?: string;
  issueCategory?: string;
  explicitOnly?: boolean;
}

// ── Detail types (full report) ───────────────────────────────────────

export interface LagReportDetail {
  id: string;
  gameId: number;
  floGameId: number;
  gameName: string;
  mapPath: string;
  serverNodeId: number;
  serverNodeName: string;
  hasExplicitReport: boolean;
  players: LagReportPlayer[];
  serverSidePing: ServerSidePingData[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface LagReportPlayer {
  battleTag: string;
  clientIp: string | null;
  connectionType: string;
  proxyName: string | null;
  proxyIp: string | null;
  proxyPort: number | null;
  isExplicit: boolean;
  issueCategories: string[];
  freeText: string;
  annotations: LagReportAnnotation[];
  diagnostics: PlayerDiagnostics;
}

export interface PlayerDiagnostics {
  lagEvents: LagEvent[];
  targetMtr: TraceMeasurement[];
  allServerBaselines: ServerBaseline[];
  reverseMtr: TraceMeasurement[];
  pingHistory: PingSample[];
  connectionEvents: ConnectionEventData[];
}

export interface LagEvent {
  timestamp: string;
  gameTimeOffsetMs: number;
  annotation: string | null;
}

export interface TraceMeasurement {
  timestamp: string;
  target: string;
  hops: HopData[];
}

export interface ServerBaseline {
  timestamp: string;
  serverId: number;
  serverName: string;
  target: string;
  hops: HopData[];
}

export interface HopData {
  hopNumber: number;
  host: string | null;
  avgRttMs: number | null;
  minRttMs: number | null;
  maxRttMs: number | null;
  stddevMs: number | null;
  lossPercent: number;
}

export interface PingSample {
  timestamp: string;
  min: number | null;
  max: number | null;
  avg: number | null;
  stddev: number | null;
  current: number | null;
  lossRate: number;
}

export interface ConnectionEventData {
  timestamp: string;
  gameTimeOffsetMs: number;
  eventType: string;
  durationMs: number | null;
}

export interface LagReportAnnotation {
  gameTimeOffsetMs: number;
  text: string;
}

export interface ServerSidePingData {
  playerId: number;
  playerName: string;
  samples: ServerPingSample[];
}

export interface ServerPingSample {
  time: number;
  min: number | null;
  max: number | null;
  avg: number | null;
}
