import type { FleetGroupBy } from "@/store/admin/networkDiagnostics/fleetSelection";
import type { AggregateGroupKey, AggregateResponseDto, AggregateRowDto, NetDiagMethod, NetDiagPath, ObservationDto, RunDto, TargetsDto } from "@/store/admin/networkDiagnostics/types";
import { asnText, formatMs, formatPercent, formatShare, geoText, METHOD_LABELS } from "./format";
import { customTargetKey, customTargetText } from "./runDraft";

export type { FleetGroupBy, FleetSelection } from "@/store/admin/networkDiagnostics/fleetSelection";

export interface SelectItem<T> {
  title: string;
  value: T;
}

export const FLEET_GROUP_BY_ITEMS: SelectItem<FleetGroupBy>[] = [
  { title: "Country", value: "country" },
  { title: "Network (ASN)", value: "asn" },
  { title: "City", value: "city" },
];

/** The run's targets as C4 keys, named from the catalogue when it is loaded. */
export function runTargetItems(run: Pick<RunDto, "targets">, catalogue: TargetsDto | null): SelectItem<string>[] {
  const t = run.targets;
  const nodeNames = new Map((catalogue?.floNodes ?? []).map((node) => [node.id, node.name] as const));
  const coreLabels = new Map((catalogue?.coreServers ?? []).map((server) => [server.key, server.label] as const));
  const baselineLabels = new Map((catalogue?.baselines ?? []).map((baseline) => [baseline.key, baseline.label] as const));
  const nodeIds = t.allFloNodes ? (catalogue?.floNodes ?? []).map((node) => node.id) : t.floNodeIds;
  return [
    ...nodeIds.map((id) => ({ title: nodeNames.get(id) ?? `Node ${id}`, value: `flo:${id}` })),
    ...t.coreServers.map((key) => ({ title: coreLabels.get(key) ?? key, value: `core:${key}` })),
    ...t.baselines.map((key) => ({ title: baselineLabels.get(key) ?? key, value: `baseline:${key}` })),
    ...t.customTargets.map((target) => ({ title: customTargetText(target), value: customTargetKey(target) })),
    ...(t.includeDefaultGateway ? [{ title: "Default gateway", value: "gateway" }] : []),
  ];
}

/** Only flo nodes have a proxied path (spec §6.1). */
export function pathItems(targetKey: string): NetDiagPath[] {
  return targetKey.startsWith("flo:") ? ["direct", "proxied"] : ["direct"];
}

export function methodItems(methods: readonly NetDiagMethod[]): SelectItem<NetDiagMethod>[] {
  return methods.map((method) => ({ title: METHOD_LABELS[method], value: method }));
}

function keyPartLabel(key: AggregateGroupKey, row: AggregateRowDto): string {
  const value = row.key[key];
  if (value === null || value === undefined || value === "") return "Unknown";
  if (key === "asn") return asnText(Number(value), row.asnOrg);
  if (key === "vpn") return value === true ? "VPN" : "No VPN";
  return String(value);
}

export function aggregateKeyLabel(row: AggregateRowDto, groupBy: readonly AggregateGroupKey[]): string {
  return groupBy.map((key) => keyPartLabel(key, row)).join(" · ");
}

export interface AggregateTableRow {
  label: string;
  count: number;
  p50Median: string;
  p50P90: string;
  lossMedian: string;
  lossOver1: string;
  unreachable: string;
}

export function aggregateTableRows(response: AggregateResponseDto): AggregateTableRow[] {
  return response.rows.map((row) => ({
    label: aggregateKeyLabel(row, response.groupBy),
    count: row.count,
    p50Median: formatMs(row.p50MsMedian),
    p50P90: formatMs(row.p50MsP90),
    lossMedian: formatPercent(row.lossPctMedian),
    lossOver1: formatShare(row.shareLossOver1Pct),
    unreachable: formatShare(row.shareUnreachable),
  }));
}

/** More bars than this stop being readable; the table keeps every group. */
export const MAX_CHART_GROUPS = 20;

export interface AggregateBars {
  labels: string[];
  p50Median: (number | null)[];
  p50P90: (number | null)[];
}

/** Rows arrive sorted by count descending (C6), so the first `max` are the largest groups. */
export function aggregateBars(response: AggregateResponseDto, max = MAX_CHART_GROUPS): AggregateBars {
  const rows = response.rows.slice(0, max);
  return {
    labels: rows.map((row) => `${aggregateKeyLabel(row, response.groupBy)} (${row.count})`),
    p50Median: rows.map((row) => row.p50MsMedian ?? null),
    p50P90: rows.map((row) => row.p50MsP90 ?? null),
  };
}

export type MapMetric = "p50" | "loss";
export type ColorBucket = "good" | "fair" | "bad" | "unknown";
export const COLOR_BUCKETS: readonly ColorBucket[] = ["good", "fair", "bad", "unknown"];

export const P50_FAIR_MS = 80;
export const P50_BAD_MS = 150;
export const LOSS_FAIR_PCT = 0.5;
export const LOSS_BAD_PCT = 2;

export function p50Bucket(ms: number | null | undefined): ColorBucket {
  if (ms === null || ms === undefined) return "unknown";
  if (ms < P50_FAIR_MS) return "good";
  return ms < P50_BAD_MS ? "fair" : "bad";
}

export function lossBucket(pct: number | null | undefined): ColorBucket {
  if (pct === null || pct === undefined) return "unknown";
  if (pct <= LOSS_FAIR_PCT) return "good";
  return pct <= LOSS_BAD_PCT ? "fair" : "bad";
}

export function observationBucket(observation: Pick<ObservationDto, "outcome" | "p50Ms" | "lossPct">, metric: MapMetric): ColorBucket {
  if (observation.outcome === "unreachable") return "bad";
  if (observation.outcome !== "ok") return "unknown";
  return metric === "p50" ? p50Bucket(observation.p50Ms) : lossBucket(observation.lossPct);
}

/** Vuetify theme colour name per bucket, resolved at draw time with readThemeColor. */
export const BUCKET_THEME_COLOR: Record<ColorBucket, string> = {
  good: "success",
  fair: "warning",
  bad: "error",
  unknown: "on-surface",
};

export function bucketLegend(metric: MapMetric): Record<ColorBucket, string> {
  return metric === "p50"
    ? { good: `p50 < ${P50_FAIR_MS} ms`, fair: `${P50_FAIR_MS}–${P50_BAD_MS} ms`, bad: `≥ ${P50_BAD_MS} ms or unreachable`, unknown: "no data" }
    : { good: `loss ≤ ${LOSS_FAIR_PCT}%`, fair: `≤ ${LOSS_BAD_PCT}%`, bad: `> ${LOSS_BAD_PCT}% or unreachable`, unknown: "no data" };
}

export interface MapPoint {
  lat: number;
  lon: number;
  bucket: ColorBucket;
  /** Plain text; render with {@link tooltipElement}, never as HTML. */
  label: string;
}

/** One dot per measurement (observations are one row per measurement for a target × path × method). */
export function mapPoints(observations: readonly ObservationDto[], metric: MapMetric): MapPoint[] {
  return observations.flatMap((o) => {
    if (o.lat === null || o.lat === undefined || o.lon === null || o.lon === undefined) return [];
    const label = [o.battleTag, geoText(o), asnText(o.asn, o.asnOrg), `p50 ${formatMs(o.p50Ms)}`, `loss ${formatPercent(o.lossPct)}`, o.outcome].join(" · ");
    return [{ lat: o.lat, lon: o.lon, bucket: observationBucket(o, metric), label }];
  });
}

/** Leaflet tooltips take HTML strings; labels carry BattleTags and GeoIP names, so they go in as a text node. */
export function tooltipElement(doc: Document, label: string): HTMLElement {
  const element = doc.createElement("span");
  element.textContent = label;
  return element;
}
