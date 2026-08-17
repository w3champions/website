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
  reportsError: string | null;
  selectedReport: LagReportDetail | null;
  selectedReportLoading: boolean;
  selectedReportError: string | null;
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
  // Wire name is snake_case — the backend pins it with JsonPropertyName. The
  // launcher's own fault verdict (e.g. "LAN", "LastMile"); typed as strings so
  // new tags pass through without a frontend release.
  connection_issue_tags: string[];
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
  // Name prefixes and exact node ids, each list OR'd server-side (repeated params).
  serverNames?: string[];
  serverNodeIds?: number[];
  proxyName?: string;
  proxyIp?: string;
  dateFrom?: string;
  dateTo?: string;
  // OR'd server-side: a report matches when any player carries any of them.
  issueCategories?: string[];
  connectionIssueTag?: string;
  explicitOnly?: boolean;
  minPlayers?: number;
  maxPlayers?: number;
}

// ── Aggregate (counts grouped by one dimension) ──────────────────────

export type LagReportAggregateDimension = "day" | "node-day" | "category" | "server" | "proxy" | "battleTag";

export interface LagReportAggregateParams extends Omit<LagReportQueryParams, "page" | "pageSize"> {
  groupBy: LagReportAggregateDimension;
  limit?: number;
}

export interface LagReportCategoryCount {
  category: string;
  count: number;
}

/** One bucket; which key/extra fields are present depends on the dimension. */
export interface LagReportAggregateBucket {
  day?: string;
  serverNodeId?: number;
  serverNodeName?: string;
  category?: string;
  proxyName?: string;
  battleTag?: string;
  count: number;
  explicitCount?: number;
  distinctPlayers?: number;
  topCategories?: LagReportCategoryCount[];
  distinctNodes?: number;
  // battleTag dimension: reports this player submitted themselves; count is
  // reports they merely appear in.
  submittedCount?: number;
}

export interface LagReportAggregateResponse {
  buckets: LagReportAggregateBucket[];
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
