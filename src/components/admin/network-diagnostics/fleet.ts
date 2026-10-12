import type { FleetGroupBy } from "@/store/admin/networkDiagnostics/fleetSelection";
import type { AggregateGroupKey, AggregateResponseDto, AggregateRowDto, NetDiagMethod, NetDiagPath, ObservationDto, RunDto, TargetsDto } from "@/store/admin/networkDiagnostics/types";
import { asnText, formatMs, formatPercent, formatShare, geoText, METHOD_LABELS } from "./format";
import { MAX_SCANNED_OBSERVATIONS } from "@/services/admin/NetworkDiagnosticsService";
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
  const nodeNames = new Map((catalogue?.floNodes ?? []).map((node) => [node.id, node.isDisabled ? `${node.name || `Node ${node.id}`} (disabled)` : node.name || `Node ${node.id}`] as const));
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
    // The share counts only measurements with samples; the backend answers 0 (never null) for a group without any.
    // Such a group has no median loss either, which is what tells it from a real 0 %.
    lossOver1: row.lossPctMedian === null || row.lossPctMedian === undefined ? formatShare(null) : formatShare(row.shareLossOver1Pct),
    unreachable: formatShare(row.shareUnreachable),
  }));
}

/** More bars than this stop being readable; the table keeps every group. */
export const MAX_CHART_GROUPS = 20;

/** Longer group names are cut on the axis: the chart gives its labels at most half its width and clips them at the start. */
export const MAX_CHART_NAME_CHARS = 22;

/** Axis label of one bar: the start of the group name (it carries the AS number) and the count. */
export function chartTickLabel(name: string, count: number, maxNameChars = MAX_CHART_NAME_CHARS): string {
  const shown = name.length > maxNameChars ? `${name.slice(0, maxNameChars).trimEnd()}…` : name;
  return `${shown} (${count})`;
}

/** The axis label of a tick: on a category axis the tick value is the index of its label. Empty for any other value. */
export function chartTickLabelAt(tickLabels: readonly string[], value: unknown): string {
  return typeof value === "number" && Number.isInteger(value) ? tickLabels[value] ?? "" : "";
}

export interface AggregateBars {
  /** Full names, shown in the chart tooltip. */
  labels: string[];
  /** What the axis shows: {@link chartTickLabel}. */
  tickLabels: string[];
  p50Median: (number | null)[];
  p50P90: (number | null)[];
}

/** Rows arrive sorted by count descending (C6), so the first `max` are the largest groups. */
export function aggregateBars(response: AggregateResponseDto, max = MAX_CHART_GROUPS): AggregateBars {
  const rows = response.rows.slice(0, max);
  return {
    labels: rows.map((row) => `${aggregateKeyLabel(row, response.groupBy)} (${row.count})`),
    tickLabels: rows.map((row) => chartTickLabel(aggregateKeyLabel(row, response.groupBy), row.count)),
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

/**
 * An unreachable target is bad on either metric (its figures are those of the last answering hop). Otherwise the
 * figures decide, whatever the outcome: a ping that timed out carries 100 % loss and no round-trip time, which
 * is the worst case for both metrics and not "no data". Unknown is left for a probe that measured nothing.
 */
export function observationBucket(observation: Pick<ObservationDto, "outcome" | "p50Ms" | "lossPct">, metric: MapMetric): ColorBucket {
  if (observation.outcome === "unreachable") return "bad";
  const hasLoss = typeof observation.lossPct === "number";
  if (metric === "loss") return hasLoss ? lossBucket(observation.lossPct) : "unknown";
  if (typeof observation.p50Ms === "number") return p50Bucket(observation.p50Ms);
  return hasLoss ? "bad" : "unknown";
}

/** Worst first, for the dot that several measurements share; a measurement without data never hides one with data. */
const BUCKET_SEVERITY: Record<ColorBucket, number> = { bad: 3, fair: 2, good: 1, unknown: 0 };

function worseBucket(a: ColorBucket, b: ColorBucket): ColorBucket {
  return BUCKET_SEVERITY[b] > BUCKET_SEVERITY[a] ? b : a;
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
    ? { good: `p50 < ${P50_FAIR_MS} ms`, fair: `${P50_FAIR_MS}–${P50_BAD_MS} ms`, bad: `≥ ${P50_BAD_MS} ms, unreachable or no answer`, unknown: "no data" }
    : { good: `loss ≤ ${LOSS_FAIR_PCT}%`, fair: `≤ ${LOSS_BAD_PCT}%`, bad: `> ${LOSS_BAD_PCT}% or unreachable`, unknown: "no data" };
}

export interface MapPoint {
  lat: number;
  lon: number;
  /** The worst bucket among the measurements at this point. */
  bucket: ColorBucket;
  /** One plain-text line per measurement at this point; render with {@link tooltipElement}, never as HTML. */
  labels: string[];
}

/**
 * One dot per coordinate (observations are one row per measurement for a target × path × method). GeoIP gives
 * every client it cannot place more exactly the same point (all "US, no city" clients share one), so measurements
 * with identical coordinates share a dot instead of hiding each other.
 */
export function mapPoints(observations: readonly ObservationDto[], metric: MapMetric): MapPoint[] {
  const byCoordinate = new Map<string, MapPoint>();
  for (const o of observations) {
    if (o.lat === null || o.lat === undefined || o.lon === null || o.lon === undefined) continue;
    const label = [o.battleTag, geoText(o), asnText(o.asn, o.asnOrg), `p50 ${formatMs(o.p50Ms)}`, `loss ${formatPercent(o.lossPct)}`, o.outcome].join(" · ");
    const bucket = observationBucket(o, metric);
    const key = `${o.lat},${o.lon}`;
    // The groups are local to this call and filled in place: copying a group per member is quadratic,
    // and one coordinate can hold thousands of measurements. Callers only ever see the finished points.
    const point = byCoordinate.get(key);
    if (point === undefined) {
      byCoordinate.set(key, { lat: o.lat, lon: o.lon, bucket, labels: [label] });
    } else {
      point.bucket = worseBucket(point.bucket, bucket);
      point.labels.push(label);
    }
  }
  return [...byCoordinate.values()];
}

/** Measurements drawn: every dot counts each measurement it stands for. */
export function locatedCount(points: readonly MapPoint[]): number {
  return points.reduce((sum, point) => sum + point.labels.length, 0);
}

/** Measurements a tooltip lists by name; the rest of a crowded dot is counted. */
export const MAX_TOOLTIP_MEMBERS = 5;

/**
 * Leaflet tooltips take HTML strings; labels carry BattleTags and GeoIP names, so every line goes in as a text node.
 * One line per measurement at the dot, at most {@link MAX_TOOLTIP_MEMBERS}, then "and N more".
 */
export function tooltipElement(doc: Document, labels: readonly string[]): HTMLElement {
  const element = doc.createElement("div");
  const hidden = labels.length - MAX_TOOLTIP_MEMBERS;
  for (const text of hidden > 0 ? [...labels.slice(0, MAX_TOOLTIP_MEMBERS), `and ${hidden.toLocaleString("en-US")} more`] : labels) {
    const line = doc.createElement("div");
    line.textContent = text;
    element.appendChild(line);
  }
  return element;
}

export interface MapSummary {
  /** Measurements drawn (a dot can stand for several). */
  shown: number;
  /** Held measurements without a location. */
  withoutLocation: number;
  /** True when the server may hold more measurements than were loaded. */
  truncated: boolean;
}

/** One sentence under the map; null when there is nothing to add to the dots. */
export function mapNotice(summary: MapSummary): string | null {
  const parts: string[] = [];
  if (summary.truncated) {
    parts.push(summary.shown > 0 ? `Showing the first ${summary.shown.toLocaleString("en-US")} loaded measurements on the map; more may exist.` : "The measurement list was cut off before any located measurement; more may exist.");
  }
  if (summary.withoutLocation > 0) {
    const one = summary.withoutLocation === 1;
    parts.push(`${summary.withoutLocation.toLocaleString("en-US")} loaded ${one ? "measurement has" : "measurements have"} no location and ${one ? "is" : "are"} not drawn.`);
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

export function aggregateMeasurementCount(response: AggregateResponseDto): number {
  return response.rows.reduce((sum, row) => sum + row.count, 0);
}

export interface MapLagInputs {
  /** Measurements the aggregate counts; null while none is held. */
  aggregateCount: number | null;
  /** Observations the map holds, with or without a location. */
  loadedObservations: number;
  observationsTruncated: boolean;
  /** Both loads finished without an error for the selection shown. */
  settled: boolean;
}

/**
 * `GET observations` leaves out rows younger than 30 s (so its cursor never skips a late write), `GET aggregate`
 * does not: right after a submit the table is ahead of the map. Null when the map's own cap explains the gap.
 */
export function mapLagNotice(inputs: MapLagInputs): string | null {
  if (!inputs.settled || inputs.aggregateCount === null || inputs.observationsTruncated) return null;
  return inputs.aggregateCount > inputs.loadedObservations ? "Results appear on the map about 30 seconds after they arrive. Refresh to update." : null;
}

/** Shown when the aggregate carried the truncation header: the server read only its newest observations. */
export const AGGREGATE_TRUNCATED_NOTICE = `Aggregates cover the newest ${MAX_SCANNED_OBSERVATIONS.toLocaleString("en-US")} observations only; narrow the selection.`;

/** The chart keeps the largest groups only; the table lists them all. */
export function chartNotice(groupCount: number, max = MAX_CHART_GROUPS): string | null {
  return groupCount > max ? `The chart shows the ${max} largest of ${groupCount} groups; the table lists all.` : null;
}

export type FleetEmptyState = "targets-loading" | "targets-unavailable" | "no-targets";

/**
 * Why the fleet view has no target to select at all, or null when it has one. A run on "all flo nodes"
 * only knows its nodes once the catalogue is loaded; its other targets are selectable without it.
 */
export function fleetEmptyState(run: Pick<RunDto, "targets">, catalogue: TargetsDto | null, catalogueLoading: boolean, itemCount: number): FleetEmptyState | null {
  if (itemCount > 0) return null;
  if (run.targets.allFloNodes && catalogue === null) return catalogueLoading ? "targets-loading" : "targets-unavailable";
  return "no-targets";
}

/** True while the flo nodes of an "all flo nodes" run cannot be listed because the catalogue is missing. */
export function floNodesMissing(run: Pick<RunDto, "targets">, catalogue: TargetsDto | null): boolean {
  return run.targets.allFloNodes && catalogue === null;
}

export interface FleetLoadInputs {
  selectionKey: string;
  groupBy: FleetGroupBy;
  run: unknown;
}

/**
 * Which loads a change of the view's inputs needs. The aggregate loads on every change; the (paged, up to
 * 20 000 rows) observations only when the selection or the run changed, never for another group key.
 */
export function fleetLoadPlan(next: FleetLoadInputs, previous: FleetLoadInputs | undefined): { observations: boolean; aggregate: boolean } {
  const observations = previous === undefined || next.selectionKey !== previous.selectionKey || next.run !== previous.run;
  return { observations, aggregate: true };
}
