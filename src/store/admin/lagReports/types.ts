export enum EConnectionType {
  Direct = "Direct",
  Proxied = "Proxied",
}

export enum EConnectionEventType {
  Reconnect = "Reconnect",
  FailureDisconnect = "FailureDisconnect",
  GameCrashed = "GameCrashed",
  GamePaused = "GamePaused",
  GameResumed = "GameResumed",
  StartLag = "StartLag",
  StopLag = "StopLag",
}

export enum EIssueCategory {
  InputDelay = "InputDelay",
  GameStutter = "GameStutter",
  WaitingForPlayers = "WaitingForPlayers",
  RubberBanding = "RubberBanding",
  SpikeLag = "SpikeLag",
  ConsistentLag = "ConsistentLag",
  Reconnecting = "Reconnecting",
  FullDisconnect = "FullDisconnect",
  Desync = "Desync",
  FpsDrops = "FpsDrops",
  GameCrashed = "GameCrashed",
  Other = "Other",
}

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
  connectionType: EConnectionType;
  proxyName: string | null;
  issueCategories: EIssueCategory[];
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
  gameSearch?: string;
  serverName?: string;
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
  connectionType: EConnectionType;
  proxyName: string | null;
  proxyIp: string | null;
  proxyPort: number | null;
  isExplicit: boolean;
  issueCategories: EIssueCategory[];
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
  eventType: EConnectionEventType;
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
