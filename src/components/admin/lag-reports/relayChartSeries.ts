import type { RelayConnection, RelayLeg, RelaySeries } from "@/store/admin/lagReports/types";
import { isMeasurableStatus, legLabel, legStatusText } from "./relayLegs";
import { type ChartPoint, seriesHighlight, seriesSrttPoints } from "./relaySeries";

export const FELT_GROUP = "Felt by the player";

// Okabe–Ito hues: distinguishable under the common colour-vision deficiencies and readable on
// both themes. Yellow is left out because it vanishes on the light theme.
const LEG_COLORS = ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00"];
// Neutral so the felt lines never read as one of the legs.
const FELT_COLOR = "#8a8a8a";
const FAR_DASH = [6, 3];
const SERVER_PING_DASH = [2, 3];

export type RelayChartStyle = "felt" | "srtt" | "stall";

export interface RelayChartSeries {
  legendKey: string;
  label: string;
  style: RelayChartStyle;
  color: string;
  dash: number[];
  width: number;
  points: ChartPoint[];
  /** srtt lines only: buckets that retransmitted, drawn as markers on the line. */
  retransmitAt?: boolean[];
  /** srtt lines only: retransmits per bucket, for the tooltip. */
  retransmits?: (number | null)[];
  yAxis: "y" | "yStall";
}

export interface LegendItem {
  key: string;
  label: string;
  style: RelayChartStyle;
  color: string;
  dash: number[];
}

export interface LegendGroup {
  title: string;
  items: LegendItem[];
  /** Why a leg has no lines, in plain words. */
  note?: string;
}

export interface RelayChartInput {
  connections: RelayConnection[];
  echoRtt: ChartPoint[];
  serverPing: ChartPoint[];
}

type GroupBuilder = { group: LegendGroup; color: string };

function hasPoints(points: ChartPoint[]): boolean {
  return points.some((p) => p.y != null);
}

function legendItem(s: RelayChartSeries): LegendItem {
  return { key: s.legendKey, label: s.label, style: s.style, color: s.color, dash: s.dash };
}

function feltSeries(input: RelayChartInput): RelayChartSeries[] {
  const out: RelayChartSeries[] = [];
  if (hasPoints(input.echoRtt)) {
    out.push({ legendKey: "felt|echo", label: "Echo-RTT (felt)", style: "felt", color: FELT_COLOR, dash: [], width: 2.5, points: input.echoRtt, yAxis: "y" });
  }
  if (hasPoints(input.serverPing)) {
    out.push({ legendKey: "felt|ssp", label: "ServerSidePing", style: "felt", color: FELT_COLOR, dash: SERVER_PING_DASH, width: 1.5, points: input.serverPing, yAxis: "y" });
  }
  return out;
}

function endSeries(leg: RelayLeg, end: "near" | "far", series: RelaySeries, color: string): RelayChartSeries[] {
  const at = end === "near" ? leg.fromLabel : leg.toLabel;
  const key = `${legLabel(leg)}|${end}`;
  const dash = end === "near" ? [] : FAR_DASH;
  const highlight = seriesHighlight(series);
  const out: RelayChartSeries[] = [{
    legendKey: `${key}|srtt`,
    label: `srtt at ${at}`,
    style: "srtt",
    color,
    dash,
    width: 1.5,
    points: seriesSrttPoints(series),
    retransmitAt: highlight.retransmitAt,
    retransmits: series.buckets.retransDelta,
    yAxis: "y",
  }];
  if (highlight.hasStall) {
    out.push({ legendKey: `${key}|stall`, label: `stall seconds at ${at}`, style: "stall", color, dash, width: 0, points: highlight.stallSteps, yAxis: "yStall" });
  }
  return out;
}

/** Chart lines for one player: felt echo-RTT and ServerSidePing, then every leg end in chain order. */
export function buildRelayChartSeries(input: RelayChartInput): { series: RelayChartSeries[]; groups: LegendGroup[] } {
  const series = feltSeries(input);
  const groups: LegendGroup[] = series.length ? [{ title: FELT_GROUP, items: series.map(legendItem) }] : [];
  const legGroups = new Map<string, GroupBuilder>();

  for (const connection of input.connections) {
    for (const leg of connection.legs) {
      const label = legLabel(leg);
      let builder = legGroups.get(label);
      if (!builder) {
        builder = { group: { title: label, items: [] }, color: LEG_COLORS[legGroups.size % LEG_COLORS.length] };
        legGroups.set(label, builder);
        groups.push(builder.group);
      }
      if (!isMeasurableStatus(leg.status)) {
        builder.group.note ??= legStatusText(leg.status);
        continue;
      }
      for (const end of ["near", "far"] as const) {
        const s = leg[end];
        if (!s?.buckets.srttMaxMs.length) continue;
        for (const line of endSeries(leg, end, s, builder.color)) {
          series.push(line);
          if (!builder.group.items.some((i) => i.key === line.legendKey)) builder.group.items.push(legendItem(line));
        }
      }
    }
  }

  return { series, groups };
}
