/** Network diagnostics admin API (contract C6). JSON is camelCase; names are verbatim. */

export const NETDIAG_METHODS = ["IcmpTraceroute", "IcmpMtr", "TcpTraceroute", "TcpMtr", "TcpPing", "FloUdpPing"] as const;
export type NetDiagMethod = (typeof NETDIAG_METHODS)[number];

export type NetDiagPath = "direct" | "proxied";
export type ProbeOutcome = "ok" | "unsupported" | "unreachable" | "timeout" | "error";
export type AssignmentStatus = "Pending" | "Submitted" | "Expired";

export type Audience =
  | { kind: "Users"; battleTags: string[] }
  | { kind: "SampleCount"; count: number }
  | { kind: "SamplePercent"; percent: number }
  | { kind: "All" };

export interface CustomTarget {
  ip: string;
  tcpPort: number;
}

export interface RunTargets {
  floNodeIds: number[];
  allFloNodes: boolean;
  coreServers: string[];
  baselines: string[];
  customTargets: CustomTarget[];
  includeDefaultGateway: boolean;
}

export interface CreateRunRequest {
  audience: Audience;
  targets: RunTargets;
  methods: NetDiagMethod[];
  allowDuringGame: boolean;
  windowSeconds: number;
}

export interface RunCounters {
  assigned: number;
  delivered: number;
  submitted: number;
  expired: number;
}

export interface RunDto {
  id: string;
  createdAt: string;
  createdBy: string;
  audience: Audience;
  targets: RunTargets;
  methods: NetDiagMethod[];
  allowDuringGame: boolean;
  windowSeconds: number;
  windowStart: string | null;
  windowEnd: string | null;
  cancelledAt: string | null;
  counters: RunCounters;
  expectedDurationSeconds: number;
}

export interface PageDto<T> {
  items: T[];
  total: number;
}

export interface ClientGeo {
  country: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  asn: number | null;
  asnOrg: string | null;
  geoDbBuild: string | null;
}

export interface AssignmentDto {
  measurementId: string;
  battleTag: string;
  status: AssignmentStatus;
  deliverAfter: string;
  deliverBy: string;
  deliveredAt: string | null;
  submittedAt: string | null;
  clientGeo: ClientGeo | null;
}

export interface RunDetailDto {
  run: RunDto;
  assignments: AssignmentDto[];
}

export interface FloNodeTarget {
  id: number;
  name: string;
  location: string;
  countryId: string;
  isDisabled: boolean;
}

export interface CoreServerTarget {
  key: string;
  label: string;
  ip: string;
  tcpPort: number;
}

export interface BaselineTarget {
  key: string;
  label: string;
  region: string;
  ip: string;
  tcpPort: number;
}

export interface TargetsDto {
  floNodes: FloNodeTarget[];
  coreServers: CoreServerTarget[];
  baselines: BaselineTarget[];
}

/** `GET runs` query; `page` is zero-based. */
export interface RunsQuery {
  createdBy?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

/** The C6 shared filter set. `runIds` and `measurementIds` become repeated `runId` / `measurementId` parameters. */
export interface MeasurementFilters {
  battleTag?: string;
  runIds?: string[];
  measurementIds?: string[];
  targetKey?: string;
  nodeId?: number;
  targetIp?: string;
  path?: NetDiagPath;
  method?: NetDiagMethod;
  country?: string;
  city?: string;
  asn?: number;
  os?: string;
  adapterType?: string;
  vpn?: boolean;
  from?: string;
  to?: string;
}

export interface MeasurementSummaryDto {
  measurementId: string;
  runId: string;
  battleTag: string;
  submittedAt: string;
  clientIp: string | null;
  clientGeo: ClientGeo | null;
  /** Null when the submission omitted the OS (A12). */
  os: string | null;
  primaryAdapterType: string | null;
  vpnSuspected: boolean | null;
  targetCount: number;
  restarts: number;
}

/** Float ms except `sent`/`received`; every `*Ms` is null (or omitted) when no sample succeeded. */
export interface StatsDto {
  sent: number;
  received: number;
  lossPct: number;
  lastMs?: number | null;
  minMs?: number | null;
  avgMs?: number | null;
  maxMs?: number | null;
  stddevMs?: number | null;
  p50Ms?: number | null;
  p90Ms?: number | null;
  p95Ms?: number | null;
  p99Ms?: number | null;
  jitterMs?: number | null;
}

/** `[offsetMs, rttMs]`, offset from the window start; `rttMs` null = lost. */
export type SamplePoint = [number, number | null];

export interface HopDto {
  ttl: number;
  ip?: string | null;
  stats?: StatsDto | null;
  /** Only with `raw=true` (A4): one entry per MTR round, or per round-1 probe for traceroutes. Omitted (or null) once raw data expired. */
  samples?: SamplePoint[] | null;
}

export interface ProbeDto {
  method: NetDiagMethod;
  outcome: ProbeOutcome;
  reason?: string | null;
  /** Null or omitted for traceroute-only methods. */
  stats?: StatsDto | null;
  /** Traceroute and MTR methods only. */
  hops?: HopDto[] | null;
  /** Only with `raw=true`, and only for TcpPing / FloUdpPing. Omitted (or null) once raw data expired (A4). */
  samples?: SamplePoint[] | null;
}

export interface PathEndpoints {
  icmp?: string | null;
  tcp?: string | null;
  udp?: string | null;
}

export interface PathResultDto {
  path: NetDiagPath;
  routeLabel?: string | null;
  endpoints: PathEndpoints;
  probes: ProbeDto[];
}

export interface TargetResultDto {
  targetKey: string;
  label: string;
  paths: PathResultDto[];
}

/** C5 `flo_snapshot` row, camelCased. `max` is flo's p95 by design; `maxTrue` is the real maximum. `lossRate` is 0..1. */
export interface FloSnapshotRow {
  nodeId: number;
  nodeName: string;
  routeLabel?: string | null;
  transport?: string | null;
  health?: string | null;
  controllerStatus?: string | null;
  min?: number | null;
  max?: number | null;
  avg?: number | null;
  stddev?: number | null;
  current?: number | null;
  lossRate?: number | null;
  p50?: number | null;
  p90?: number | null;
  p99?: number | null;
  maxTrue?: number | null;
  samples?: number | null;
  windowMs?: number | null;
}

export interface PacingDto {
  mtrRoundMs: number;
  pingIntervalMs: number;
  streams: number;
}

export interface AdapterDto {
  name: string;
  kind: string;
  linkSpeedMbps?: number | null;
  mtu?: number | null;
  gateway?: string | null;
  dns?: string[] | null;
  hasDefaultRoute?: boolean | null;
  rxBps?: number | null;
  txBps?: number | null;
  upSince?: string | null;
  upSinceReason?: string | null;
}

export interface WifiDto {
  rssiDbm?: number | null;
  noiseDbm?: number | null;
  channel?: number | null;
  band?: string | null;
  txRateMbps?: number | null;
  reason?: string | null;
}

export interface CpuDto {
  model?: string | null;
  cores?: number | null;
  usagePct?: number | null;
}

export interface MemoryDto {
  totalMb?: number | null;
  usedMb?: number | null;
}

export interface VpnDto {
  suspected: boolean;
  evidence?: string[] | null;
}

export interface AntivirusDto {
  thirdParty?: string[] | null;
  reason?: string | null;
}

/** Any sub-object may be null or omitted (C5 payload rules). */
export interface SystemDto {
  cpu?: CpuDto | null;
  memory?: MemoryDto | null;
  uptimeS?: number | null;
  clockSkewMs?: number | null;
  launcherProxyConfigured?: boolean | null;
  adapters?: AdapterDto[] | null;
  wifi?: WifiDto | null;
  vpn?: VpnDto | null;
  antivirus?: AntivirusDto | null;
}

export interface IpInfoDto {
  asn?: number | null;
  asnOrg?: string | null;
  country?: string | null;
  city?: string | null;
  lat?: number | null;
  lon?: number | null;
  geoDbBuild?: string | null;
}

/** A4. `family` repeats the summary `os`; name/version are typed nullable defensively. */
export interface OsInfoDto {
  family: string;
  name?: string | null;
  version?: string | null;
}

export interface MeasurementDetailDto extends MeasurementSummaryDto {
  /** Null or omitted when the submission carried no OS (A12). */
  osInfo?: OsInfoDto | null;
  launcherVersion?: string | null;
  attemptStartedAt: string;
  windowStartedAt: string;
  windowEndedAt: string;
  pacing?: PacingDto | null;
  system?: SystemDto | null;
  floSnapshot: FloSnapshotRow[];
  defaultGateway?: string | null;
  ipInfo: Record<string, IpInfoDto>;
  targets: TargetResultDto[];
  /** True when `raw=true` was asked after the 90-day raw retention; every `samples` key is then omitted (A4). Test this flag, not the samples. */
  rawExpired?: boolean;
}

/** One flat row per measurement × target × path × method (C6 field order). */
export interface ObservationDto {
  measurementId: string;
  runId: string;
  battleTag: string;
  submittedAt: string;
  clientIp: string | null;
  country: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  asn: number | null;
  asnOrg: string | null;
  os: string | null;
  primaryAdapterType: string | null;
  vpnSuspected: boolean | null;
  targetKey: string;
  targetLabel: string;
  targetIp: string | null;
  path: NetDiagPath;
  routeLabel: string | null;
  method: NetDiagMethod;
  outcome: ProbeOutcome;
  reason: string | null;
  sent: number;
  received: number;
  lossPct: number | null;
  minMs: number | null;
  avgMs: number | null;
  maxMs: number | null;
  stddevMs: number | null;
  p50Ms: number | null;
  p90Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  jitterMs: number | null;
  hopCount: number;
  lastHopIp: string | null;
  lastHopAsn: number | null;
}

export interface ObservationsPageDto {
  items: ObservationDto[];
  nextCursor: string | null;
}

export const AGGREGATE_GROUP_KEYS = ["country", "city", "asn", "os", "adapterType", "vpn", "targetKey", "path", "method", "runId"] as const;
export type AggregateGroupKey = (typeof AGGREGATE_GROUP_KEYS)[number];

export interface AggregateRowDto {
  key: Partial<Record<AggregateGroupKey, string | number | boolean | null>>;
  count: number;
  p50MsMedian: number | null;
  p50MsP90: number | null;
  lossPctMedian: number | null;
  shareLossOver1Pct: number;
  shareUnreachable: number;
  asnOrg: string | null;
  lat: number | null;
  lon: number | null;
}

export interface AggregateResponseDto {
  groupBy: AggregateGroupKey[];
  rows: AggregateRowDto[];
}
