import { describe, expect, it } from "vitest";
import type { RelayConnection, RelayLeg, RelaySeries } from "@/store/admin/lagReports/types";
import { buildRelayChartSeries, FELT_GROUP } from "./relayChartSeries";
import { withClientEnd } from "./relayLegs";
import { clientTransportSeries } from "./relaySeries";
import { MATCH_START_MS, starbuckRelayChain, starbuckTransportStats } from "./__fixtures__/starbuckRelay";

const START = Date.UTC(2026, 9, 8, 21, 0, 0);

function series(srtt: (number | null)[], stall: number[] = srtt.map(() => 0), role = "haproxy_fe"): RelaySeries {
  return {
    role,
    kind: "tcp",
    firstSeenUnixMs: START,
    closedUnixMs: 0,
    bucketsStartUnixMs: START,
    bucketSecs: 5,
    bucketCount: srtt.length,
    buckets: {
      srttMaxMs: srtt,
      rttvarMaxMs: srtt.map(() => null),
      retransDelta: srtt.map(() => 0),
      lostMax: srtt.map(() => null),
      unackedMax: srtt.map(() => null),
      rxBytesDelta: srtt.map(() => 1),
      txBytesDelta: srtt.map(() => 1),
      stallSecs: stall,
    },
  };
}

function leg(fromLabel: string, toLabel: string, overrides: Partial<RelayLeg> = {}): RelayLeg {
  return { fromLabel, toLabel, status: "measured", near: null, far: null, close: null, ...overrides };
}

const felt = { echoRtt: [{ x: START, y: 230 }], serverPing: [{ x: START, y: 210 }] };

describe("buildRelayChartSeries", () => {
  it("draws only the felt lines for a player without relay telemetry", () => {
    const { series: out, groups } = buildRelayChartSeries({ connections: [], ...felt });

    expect(out.map((s) => s.label)).toEqual(["Echo-RTT (felt)", "ServerSidePing"]);
    expect(groups.map((g) => g.title)).toEqual([FELT_GROUP]);
  });

  it("omits felt lines that have no data", () => {
    const { series: out, groups } = buildRelayChartSeries({ connections: [], echoRtt: [], serverPing: [] });

    expect(out).toEqual([]);
    expect(groups).toEqual([]);
  });

  it("groups the legend by leg in chain order, after the felt lines", () => {
    const { groups } = buildRelayChartSeries({ connections: starbuckRelayChain.connections, ...felt });

    expect(groups.map((g) => g.title)).toEqual([
      FELT_GROUP,
      "client → eu-south-west",
      "eu-south-west → brazil-north",
      "brazil-north → brazil-north-2",
    ]);
  });

  it("draws each measured end as its own line: the sending end solid, the receiving end dashed, both in the leg's colour", () => {
    const connections: RelayConnection[] = [{ connectedUnixMs: START, legs: [leg("a", "b", { near: series([40]), far: series([41]) })] }];

    const { series: out } = buildRelayChartSeries({ connections, echoRtt: [], serverPing: [] });

    const [near, far] = out;
    expect(near.label).toBe("srtt at a");
    expect(far.label).toBe("srtt at b");
    expect(near.color).toBe(far.color);
    expect(near.dash).toEqual([]);
    expect(far.dash.length).toBeGreaterThan(0);
  });

  it("gives every leg a distinct colour", () => {
    const { groups } = buildRelayChartSeries({ connections: starbuckRelayChain.connections, ...felt });

    const legColors = groups.slice(1).map((g) => g.items[0].color);
    expect(new Set(legColors).size).toBe(legColors.length);
  });

  it("adds a stall area only for ends that stalled", () => {
    const connections: RelayConnection[] = [{
      connectedUnixMs: START,
      legs: [leg("a", "b", { near: series([40, 41]), far: series([40, 1200], [0, 2]) })],
    }];

    const { series: out } = buildRelayChartSeries({ connections, echoRtt: [], serverPing: [] });

    const stalls = out.filter((s) => s.style === "stall");
    expect(stalls.map((s) => s.label)).toEqual(["stall seconds at b"]);
    expect(stalls[0].yAxis).toBe("yStall");
  });

  it("shares one legend entry between connections that crossed the same leg", () => {
    const connections: RelayConnection[] = [
      { connectedUnixMs: START, legs: [leg("a", "b", { far: series([40]) })] },
      { connectedUnixMs: START + 60_000, legs: [leg("a", "b", { far: series([40]) })] },
    ];

    const { series: out, groups } = buildRelayChartSeries({ connections, echoRtt: [], serverPing: [] });

    expect(out).toHaveLength(2);
    expect(new Set(out.map((s) => s.legendKey)).size).toBe(1);
    expect(groups[0].items).toHaveLength(1);
  });

  it("lists an unmeasured leg in the legend with its reason and no lines", () => {
    const connections: RelayConnection[] = [{ connectedUnixMs: START, legs: [leg("a", "b", { status: "unmeasured_no_flo_node" })] }];

    const { series: out, groups } = buildRelayChartSeries({ connections, echoRtt: [], serverPing: [] });

    expect(out).toEqual([]);
    expect(groups[0].note).toBe("Not measured: this relay runs HAProxy without flo-node");
  });

  it("draws the StarBuck client end of the first leg from match telemetry", () => {
    const connections = withClientEnd(starbuckRelayChain.connections, clientTransportSeries(starbuckTransportStats, MATCH_START_MS));

    const { series: out } = buildRelayChartSeries({ connections, ...felt });

    expect(out.some((s) => s.label === "srtt at client")).toBe(true);
  });
});
