import { describe, expect, it } from "vitest";
import type { LagReportDetail } from "@/store/admin/lagReports/types";
import { buildPlayerRelayView, reportHasRelayTelemetry } from "./relayPlayerView";
import { MATCH_START_MS, SPIKE_FROM_MS, SPIKE_TO_MS, starbuckReport, starbuckTelemetry } from "./__fixtures__/starbuckRelay";

function withoutRelay(report: LagReportDetail): LagReportDetail {
  // Reports stored before relay telemetry have neither field at all.
  return {
    ...report,
    players: report.players.map(({ relayChain: _chain, floPlayerId: _id, ...rest }) => rest),
  };
}

describe("reportHasRelayTelemetry", () => {
  it("is false for a report from before relay telemetry, so it renders as before", () => {
    expect(reportHasRelayTelemetry(withoutRelay(starbuckReport))).toBe(false);
  });

  it("is false when every fetch failed or came back empty", () => {
    const report = {
      ...starbuckReport,
      players: starbuckReport.players.map((p) => ({ ...p, relayChain: { fetchedAt: "x", connections: [] } })),
    };

    expect(reportHasRelayTelemetry(report)).toBe(false);
  });

  it("is true when any player has a relay connection", () => {
    expect(reportHasRelayTelemetry(starbuckReport)).toBe(true);
  });
});

describe("buildPlayerRelayView", () => {
  it("returns null for a player without relay telemetry", () => {
    expect(buildPlayerRelayView(starbuckReport, 1, starbuckTelemetry)).toBeNull();
    expect(buildPlayerRelayView(withoutRelay(starbuckReport), 0, null)).toBeNull();
  });

  it("names the StarBuck route and its worst leg", () => {
    const view = buildPlayerRelayView(starbuckReport, 0, starbuckTelemetry)!;

    expect(view.chains).toEqual(["client → eu-south-west → brazil-north → brazil-north-2"]);
    expect(view.legs[view.worstIndex!].label).toBe("eu-south-west → brazil-north");
  });

  it("puts felt echo-RTT, ServerSidePing and every leg end on one chart", () => {
    const view = buildPlayerRelayView(starbuckReport, 0, starbuckTelemetry)!;

    const labels = view.series.map((s) => s.label);
    expect(labels).toEqual(expect.arrayContaining([
      "Echo-RTT (felt)",
      "ServerSidePing",
      "srtt at client",
      "srtt at eu-south-west",
      "srtt at brazil-north",
      "srtt at brazil-north-2",
      "stall seconds at eu-south-west",
    ]));
  });

  it("lines the relay-leg spike up with the felt spike on the wall clock", () => {
    const view = buildPlayerRelayView(starbuckReport, 0, starbuckTelemetry)!;
    const spikeAt = (label: string) => view.series.find((s) => s.label === label)!.points.filter((p) => (p.y ?? 0) >= 1000).map((p) => p.x);

    const felt = spikeAt("Echo-RTT (felt)");
    const relay = spikeAt("srtt at eu-south-west");

    expect(Math.min(...felt)).toBeGreaterThanOrEqual(SPIKE_FROM_MS);
    expect(Math.max(...felt)).toBeLessThanOrEqual(SPIKE_TO_MS);
    expect(Math.min(...relay)).toBeGreaterThanOrEqual(SPIKE_FROM_MS - 5_000);
    expect(Math.max(...relay)).toBeLessThanOrEqual(SPIKE_TO_MS);
  });

  it("anchors ServerSidePing at the telemetry match start, not at the report's creation", () => {
    const view = buildPlayerRelayView(starbuckReport, 0, starbuckTelemetry)!;

    const ssp = view.series.find((s) => s.label === "ServerSidePing")!;
    expect(ssp.points[0].x).toBe(MATCH_START_MS);
  });

  it("still draws the relay legs without match telemetry", () => {
    const view = buildPlayerRelayView(starbuckReport, 0, null)!;

    expect(view.series.some((s) => s.label === "Echo-RTT (felt)")).toBe(false);
    expect(view.series.some((s) => s.label === "srtt at client")).toBe(false);
    expect(view.series.some((s) => s.label === "srtt at brazil-north")).toBe(true);
  });
});
