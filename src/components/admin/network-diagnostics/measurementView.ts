import type { ChartPoint } from "@/components/admin/lag-reports/relaySeries";
import { formatUtc } from "@/helpers/utc-dates";
import type { HopEnrichment, MtrHopRow } from "@/store/admin/lagReports/types";
import type { AdapterDto, AntivirusDto, CpuDto, FloSnapshotRow, HopDto, IpInfoDto, MeasurementDetailDto, MemoryDto, NetDiagMethod, NetDiagPath, OsInfoDto, PathEndpoints, PathResultDto, ProbeDto, ProbeOutcome, SamplePoint, TargetResultDto, VpnDto, WifiDto } from "@/store/admin/networkDiagnostics/types";
import { asnText, DASH, formatDuration, formatMs, formatPercent, formatShare, geoText, METHOD_LABELS } from "./format";

const MS_PER_SECOND = 1000;
const PROXIED_DASH = [6, 3];
const PATH_ORDER: Record<NetDiagPath, number> = { direct: 0, proxied: 1 };

export const OUTCOME_COLOR: Record<ProbeOutcome, string> = {
  ok: "success",
  unsupported: "grey",
  unreachable: "error",
  timeout: "warning",
  error: "error",
};

function joinParts(parts: Array<string | null | undefined | false>): string {
  const present = parts.filter((part): part is string => typeof part === "string" && part !== "");
  return present.length === 0 ? DASH : present.join(" · ");
}

/** C6 hops → the shape MtrHopTable already renders for lag reports. */
export function hopRows(hops: readonly HopDto[]): MtrHopRow[] {
  return hops.map((hop) => ({
    hopNumber: hop.ttl,
    host: hop.ip ?? null,
    avgRttMs: hop.stats?.avgMs ?? null,
    minRttMs: hop.stats?.minMs ?? null,
    maxRttMs: hop.stats?.maxMs ?? null,
    stddevMs: hop.stats?.stddevMs ?? null,
    lossPercent: hop.stats?.lossPct ?? null,
  }));
}

/** GeoIP facts per hop (by index) from the measurement's `ipInfo`; null for silent hops and unknown IPs. */
export function hopEnrichment(hops: readonly HopDto[], ipInfo: Readonly<Record<string, IpInfoDto>>): (HopEnrichment | null)[] {
  return hops.map((hop) => {
    const info: IpInfoDto | undefined = hop.ip == null ? undefined : ipInfo[hop.ip];
    return info === undefined ? null : { asn: info.asn ?? null, asnOrg: info.asnOrg ?? null, city: info.city ?? null, country: info.country ?? null };
  });
}

export function orderedPaths(target: TargetResultDto): PathResultDto[] {
  return [...target.paths].sort((a, b) => PATH_ORDER[a.path] - PATH_ORDER[b.path]);
}

export function probeStatsLine(probe: ProbeDto): string {
  const s = probe.stats;
  if (s == null) return DASH;
  return [
    `p50 ${formatMs(s.p50Ms)}`,
    `p90 ${formatMs(s.p90Ms)}`,
    `p99 ${formatMs(s.p99Ms)}`,
    `max ${formatMs(s.maxMs)}`,
    `loss ${formatPercent(s.lossPct)}`,
    `jitter ${formatMs(s.jitterMs)}`,
    `${s.received}/${s.sent} answered`,
  ].join(" · ");
}

export function endpointsLine(endpoints: PathEndpoints): string {
  return joinParts([endpoints.icmp && `ICMP ${endpoints.icmp}`, endpoints.tcp && `TCP ${endpoints.tcp}`, endpoints.udp && `UDP ${endpoints.udp}`]);
}

export interface RttSeries {
  label: string;
  color: string;
  dash: number[];
  points: ChartPoint[];
}

const PING_METHODS: ReadonlySet<NetDiagMethod> = new Set<NetDiagMethod>(["TcpPing", "FloUdpPing"]);
const MTR_METHODS: ReadonlySet<NetDiagMethod> = new Set<NetDiagMethod>(["IcmpMtr", "TcpMtr"]);

/** The hop with the highest TTL: the target itself, or the furthest hop the MTR reached. */
export function finalHop(hops: readonly HopDto[] | null | undefined): HopDto | null {
  if (hops == null || hops.length === 0) return null;
  return hops.reduce((last, hop) => (hop.ttl > last.ttl ? hop : last));
}

interface SeriesSource {
  path: PathResultDto;
  label: string;
  samples: SamplePoint[];
}

function hasSamples(samples: SamplePoint[] | null | undefined): samples is SamplePoint[] {
  return samples != null && samples.length > 0;
}

/** Raw series of one path: ping probes' own samples and the final hop of each MTR (A4). Absent `samples` keys draw nothing. */
function seriesSources(path: PathResultDto): SeriesSource[] {
  return path.probes.flatMap((probe): SeriesSource[] => {
    if (PING_METHODS.has(probe.method)) {
      return hasSamples(probe.samples) ? [{ path, label: METHOD_LABELS[probe.method], samples: probe.samples }] : [];
    }
    if (!MTR_METHODS.has(probe.method)) return [];
    const hop = finalHop(probe.hops);
    if (hop === null || !hasSamples(hop.samples)) return [];
    return [{ path, label: `${METHOD_LABELS[probe.method]} (final hop ${hop.ip ?? "?"})`, samples: hop.samples }];
  });
}

/**
 * One line per raw series of the target, every path overlaid (direct first; proxied dashed).
 * x is seconds into the window; a lost sample is a gap (y null).
 */
export function rttSeries(target: TargetResultDto, palette: readonly string[]): RttSeries[] {
  return orderedPaths(target).flatMap(seriesSources).map((source, index) => ({
    label: `${source.path.path}${source.path.routeLabel ? ` (${source.path.routeLabel})` : ""} · ${source.label}`,
    color: palette[index % palette.length],
    dash: source.path.path === "proxied" ? [...PROXIED_DASH] : [],
    points: source.samples.map(([offsetMs, rttMs]) => ({ x: offsetMs / MS_PER_SECOND, y: rttMs })),
  }));
}

export const RAW_EXPIRED_NOTICE = "Raw data expired (>90 days): the RTT time-series is no longer available. The statistics below are kept.";
export const NO_RAW_SAMPLES_NOTICE = "No raw samples were recorded: only TCP ping, flo UDP ping and the final hop of ICMP/TCP MTR record a time-series.";

/** What to say about the raw series once it was requested. Tests `rawExpired`, never the (omitted) samples (A4). */
export function rawSamplesNotice(detail: { rawExpired?: boolean; targets?: TargetResultDto[] | null }, rawLoaded: boolean): string | null {
  if (!rawLoaded) return null;
  if (detail.rawExpired === true) return RAW_EXPIRED_NOTICE;
  const hasSeries = (detail.targets ?? []).some((target) => (target.paths ?? []).some((path) => seriesSources(path).length > 0));
  return hasSeries ? null : NO_RAW_SAMPLES_NOTICE;
}

export interface SnapshotRowView {
  node: string;
  route: string;
  transport: string;
  health: string;
  isHealthy: boolean;
  current: string;
  avg: string;
  p50: string;
  p90: string;
  p99: string;
  /** flo's `max`, which is p95 by design. */
  p95: string;
  maxTrue: string;
  loss: string;
  samples: string;
}

export function snapshotRows(rows: readonly FloSnapshotRow[]): SnapshotRowView[] {
  return [...rows]
    .sort((a, b) => a.nodeName.localeCompare(b.nodeName))
    .map((row) => ({
      node: row.nodeName,
      route: row.routeLabel ?? "direct",
      transport: row.transport ?? DASH,
      health: row.health ?? DASH,
      isHealthy: row.health == null || row.health === "ok",
      current: formatMs(row.current),
      avg: formatMs(row.avg),
      p50: formatMs(row.p50),
      p90: formatMs(row.p90),
      p99: formatMs(row.p99),
      p95: formatMs(row.max),
      maxTrue: formatMs(row.maxTrue),
      loss: formatShare(row.lossRate),
      samples: row.samples == null ? DASH : row.windowMs == null ? String(row.samples) : `${row.samples} over ${formatDuration(row.windowMs / MS_PER_SECOND)}`,
    }));
}

const BITS_PER_KBIT = 1_000;
const BITS_PER_MBIT = 1_000_000;

/** A8: adapter `rxBps`/`txBps` are bits per second. */
export function formatBitRate(bps: number | null | undefined): string {
  if (bps == null) return DASH;
  if (bps >= BITS_PER_MBIT) return `${(bps / BITS_PER_MBIT).toFixed(1)} Mbit/s`;
  if (bps >= BITS_PER_KBIT) return `${(bps / BITS_PER_KBIT).toFixed(1)} kbit/s`;
  return `${Math.round(bps)} bit/s`;
}

/** The time the adapter came up, else the server's `upSinceReason` verbatim (A8); nothing when neither is known. */
function upSinceText(adapter: AdapterDto): string | false {
  if (adapter.upSince) return `up since ${formatUtc(adapter.upSince)}`;
  return adapter.upSinceReason ? `up since unknown: ${adapter.upSinceReason}` : false;
}

export function adapterLine(adapter: AdapterDto): string {
  const dns = adapter.dns ?? [];
  return joinParts([
    adapter.name,
    adapter.kind,
    adapter.linkSpeedMbps != null && `${adapter.linkSpeedMbps} Mbps`,
    adapter.mtu != null && `MTU ${adapter.mtu}`,
    adapter.gateway != null && `gateway ${adapter.gateway}`,
    dns.length > 0 && `DNS ${dns.join(", ")}`,
    adapter.hasDefaultRoute === true && "default route",
    adapter.rxBps != null && `rx ${formatBitRate(adapter.rxBps)}`,
    adapter.txBps != null && `tx ${formatBitRate(adapter.txBps)}`,
    upSinceText(adapter),
  ]);
}

/** A4: "Windows 11 Pro 10.0.26200"; the family alone when the launcher sent no name. */
export function osText(detail: { os?: string | null; osInfo?: OsInfoDto | null }): string {
  const named = [detail.osInfo?.name, detail.osInfo?.version].filter((part): part is string => typeof part === "string" && part !== "").join(" ");
  if (named !== "") return named;
  const family = detail.osInfo?.family || detail.os;
  return family ? family : DASH;
}

/** Measured values and the server's `reason` sibling are not exclusive: show both, the reason verbatim. */
function withReason(values: string, reason: string | null | undefined, noValuesPrefix: string): string {
  if (!reason) return values;
  return values === DASH ? `${noValuesPrefix}: ${reason}` : `${values} (reason: ${reason})`;
}

export function wifiLine(wifi: WifiDto | null | undefined): string {
  if (wifi == null) return DASH;
  const values = joinParts([
    wifi.rssiDbm != null && `RSSI ${wifi.rssiDbm} dBm`,
    wifi.noiseDbm != null && `noise ${wifi.noiseDbm} dBm`,
    wifi.channel != null && `channel ${wifi.channel}${wifi.band ? ` (${wifi.band})` : ""}`,
    wifi.txRateMbps != null && `${wifi.txRateMbps} Mbps`,
  ]);
  return withReason(values, wifi.reason, "unavailable");
}

export function cpuLine(cpu: CpuDto | null | undefined): string {
  if (cpu == null) return DASH;
  return joinParts([cpu.model, cpu.cores != null && `${cpu.cores} cores`, cpu.usagePct != null && `${cpu.usagePct}% busy`]);
}

export function memoryLine(memory: MemoryDto | null | undefined): string {
  if (memory == null || memory.totalMb == null) return DASH;
  return `${memory.usedMb ?? "?"} / ${memory.totalMb} MB`;
}

export function vpnLine(vpn: VpnDto | null | undefined): string {
  if (vpn == null) return DASH;
  return vpn.suspected ? `suspected: ${(vpn.evidence ?? []).join("; ") || "no detail"}` : "not detected";
}

export function antivirusLine(antivirus: AntivirusDto | null | undefined): string {
  if (antivirus == null) return DASH;
  const apps = antivirus.thirdParty ?? [];
  if (apps.length === 0 && antivirus.reason) return `unknown: ${antivirus.reason}`;
  return withReason(apps.length > 0 ? apps.join(", ") : "none detected", antivirus.reason, "reason");
}

export interface Fact {
  label: string;
  value: string;
}

/** Header facts of a measurement; every value is display text (a dash when unknown). */
export function measurementFacts(detail: MeasurementDetailDto): Fact[] {
  const system = detail.system;
  const pacing = detail.pacing;
  const uptime = system?.uptimeS ?? null;
  const skew = system?.clockSkewMs ?? null;
  const proxy = system?.launcherProxyConfigured ?? null;
  return [
    { label: "Submitted", value: formatUtc(detail.submittedAt) },
    { label: "Window", value: `${formatUtc(detail.windowStartedAt)} – ${formatUtc(detail.windowEndedAt)}` },
    { label: "Restarts", value: String(detail.restarts) },
    { label: "Client IP", value: detail.clientIp ?? DASH },
    { label: "Location", value: geoText(detail.clientGeo) },
    { label: "Network", value: asnText(detail.clientGeo?.asn, detail.clientGeo?.asnOrg) },
    { label: "OS", value: osText(detail) },
    { label: "Launcher", value: detail.launcherVersion ?? DASH },
    { label: "Primary adapter", value: detail.primaryAdapterType ?? DASH },
    { label: "Default gateway", value: detail.defaultGateway ?? DASH },
    { label: "VPN", value: vpnLine(system?.vpn ?? null) },
    { label: "Wi-Fi", value: wifiLine(system?.wifi ?? null) },
    { label: "Antivirus", value: antivirusLine(system?.antivirus ?? null) },
    { label: "CPU", value: cpuLine(system?.cpu ?? null) },
    { label: "Memory", value: memoryLine(system?.memory ?? null) },
    { label: "Uptime", value: uptime === null ? DASH : formatDuration(uptime) },
    { label: "Clock skew", value: skew === null ? DASH : `${skew} ms` },
    { label: "Launcher proxy", value: proxy === null ? DASH : proxy ? "configured" : "none" },
    { label: "Pacing", value: pacing == null ? DASH : `MTR round ${pacing.mtrRoundMs} ms · ping every ${pacing.pingIntervalMs} ms · ${pacing.streams} streams` },
  ];
}
