import type { LagReportDetail } from "@/store/admin/lagReports/types";
import type { IPlayerMatchTelemetry } from "@/store/admin/playerMatchTelemetry/types";
import { buildActionLatencyPoints } from "./actionLatencyPoints";
import { buildServerPingPoints, collectGameClockPauses, computeGameStartMs } from "./gameTimeline";
import { buildRelayChartSeries, type LegendGroup, type RelayChartSeries } from "./relayChartSeries";
import { legChainLabel, type LegSummary, relayConnections, selectWorstLeg, summarizeLegs, withClientEnd } from "./relayLegs";
import { clientTransportSeries } from "./relaySeries";

export interface PlayerRelayView {
  playerIndex: number;
  battleTag: string;
  /** Distinct routes over the player's connections, e.g. one per reconnect via another relay. */
  chains: string[];
  series: RelayChartSeries[];
  groups: LegendGroup[];
  legs: LegSummary[];
  worstIndex: number | null;
}

export function reportHasRelayTelemetry(report: Pick<LagReportDetail, "players">): boolean {
  return report.players.some((p) => relayConnections(p).length > 0);
}

/** Everything one player's relay chart and hop table show; null without relay telemetry. */
export function buildPlayerRelayView(
  report: LagReportDetail,
  playerIndex: number,
  telemetry: IPlayerMatchTelemetry | null,
): PlayerRelayView | null {
  const player = report.players[playerIndex];
  const own = relayConnections(player);
  if (!own.length) return null;

  const entry = telemetry?.players.find((p) => p.battleTag === player.battleTag) ?? null;
  const matchStartMs = telemetry?.matchWallStart.getTime() ?? null;
  const client = entry?.transportStats && matchStartMs != null ? clientTransportSeries(entry.transportStats, matchStartMs) : null;
  const connections = withClientEnd(own, client);

  const echoRtt = entry && matchStartMs != null && entry.bucketCount > 0
    ? buildActionLatencyPoints(matchStartMs, entry.meansMs, entry.sampleCounts)
    : [];
  const ssp = report.serverSidePing?.find((s) => s.playerName === player.battleTag);
  const serverPing = ssp
    ? buildServerPingPoints(ssp.samples, collectGameClockPauses(report.players), computeGameStartMs(report.players, report.createdAt))
    : [];

  const { series, groups } = buildRelayChartSeries({ connections, echoRtt, serverPing });
  const legs = summarizeLegs(connections);

  return {
    playerIndex,
    battleTag: player.battleTag,
    chains: [...new Set(connections.map((c) => legChainLabel(c.legs)).filter(Boolean))],
    series,
    groups,
    legs,
    worstIndex: selectWorstLeg(legs),
  };
}
