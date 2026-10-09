import { describe, expect, it } from "vitest";
import type { RelayConnection, RelayLeg, RelaySeries } from "@/store/admin/lagReports/types";
import { describeWorstLeg, displayedEnds, isMeasurableStatus, legChainLabel, legStatusText, relayConnections, roleText, selectWorstLeg, summarizeLegs, withClientEnd } from "./relayLegs";
import { clientTransportSeries } from "./relaySeries";
import { MATCH_START_MS, starbuckRelayChain, starbuckTransportStats } from "./__fixtures__/starbuckRelay";

const START = Date.UTC(2026, 9, 8, 21, 0, 0);

function series(srtt: (number | null)[], extra: Partial<RelaySeries["buckets"]> = {}, role = "haproxy_fe"): RelaySeries {
  const fill = <T>(v: T) => srtt.map(() => v);
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
      rttvarMaxMs: fill(null),
      retransDelta: fill(0),
      lostMax: fill(null),
      unackedMax: fill(null),
      rxBytesDelta: fill(1),
      txBytesDelta: fill(1),
      stallSecs: fill(0),
      ...extra,
    },
  };
}

function leg(fromLabel: string, toLabel: string, overrides: Partial<RelayLeg> = {}): RelayLeg {
  return { fromLabel, toLabel, status: "measured", near: null, far: null, close: null, ...overrides };
}

function connection(legs: RelayLeg[], connectedUnixMs = START): RelayConnection {
  return { connectedUnixMs, legs };
}

describe("legChainLabel", () => {
  it("joins the hops of a relayed connection into one chain", () => {
    expect(legChainLabel(starbuckRelayChain.connections[0].legs)).toBe("client → eu-south-west → brazil-north → brazil-north-2");
  });

  it("labels a direct connection as a single leg", () => {
    expect(legChainLabel([leg("client", "brazil-north-2")])).toBe("client → brazil-north-2");
  });

  it("keeps both labels when consecutive legs do not meet", () => {
    expect(legChainLabel([leg("client", "a"), leg("b", "node")])).toBe("client → a ⋯ b → node");
  });

  it("returns an empty label for no legs", () => {
    expect(legChainLabel([])).toBe("");
  });
});

describe("legStatusText", () => {
  it.each([
    ["measured", "Measured"],
    ["one_sided", "Measured at one end only: HAProxy's close line for this connection never arrived"],
    ["pending_close", "Still open when fetched; completed at match end"],
    ["unmeasured_no_flo_node", "Not measured: this relay runs HAProxy without flo-node"],
    ["unmeasured_port_rewritten", "Not measured: NAT rewrote the source port, so the hop could not be matched"],
    ["node_too_old", "Not measured: the node's flo-node predates relay telemetry"],
    ["expired", "Not measured: the node no longer holds this data (report too late, or the node restarted)"],
    ["node_unavailable", "Not measured: the node did not answer"],
    ["hop_limit", "Not measured: the relay chain is longer than the walk follows"],
  ])("explains %s in plain words", (status, text) => {
    expect(legStatusText(status)).toBe(text);
  });

  it("shows an unknown status verbatim", () => {
    expect(legStatusText("brand_new")).toBe("Unknown status: brand_new");
  });
});

describe("isMeasurableStatus", () => {
  it("accepts only statuses that can carry data", () => {
    expect(["measured", "one_sided", "pending_close"].every(isMeasurableStatus)).toBe(true);
    expect(["unmeasured_no_flo_node", "unmeasured_port_rewritten", "node_too_old", "expired", "node_unavailable", "hop_limit", "brand_new"].some(isMeasurableStatus))
      .toBe(false);
  });
});

describe("relayConnections", () => {
  it("returns no connections for a report from before relay telemetry", () => {
    expect(relayConnections({})).toEqual([]);
  });

  it("returns no connections while the fetch has not succeeded", () => {
    expect(relayConnections({ relayChain: null })).toEqual([]);
  });

  it("returns no connections for an empty chain", () => {
    expect(relayConnections({ relayChain: { fetchedAt: "2026-10-08T21:05:30Z", connections: [] } })).toEqual([]);
  });

  it("orders connections by connect time", () => {
    const late = connection([leg("client", "n")], START + 60_000);
    const early = connection([leg("client", "n")], START);

    expect(relayConnections({ relayChain: { fetchedAt: "x", connections: [late, early] } })).toEqual([early, late]);
  });
});

describe("withClientEnd", () => {
  it("fills the client end of each connection's first leg with that connection's slice of the client series", () => {
    const client = series([10, 11, 12, 13], {}, "client");
    const first = connection([leg("client", "relay"), leg("relay", "node")], START);
    const second = connection([leg("client", "relay")], START + 10_000);

    const [a, b] = withClientEnd([first, second], client);

    expect(a.legs[0].near?.buckets.srttMaxMs).toEqual([10, 11]);
    expect(b.legs[0].near?.buckets.srttMaxMs).toEqual([12, 13]);
    expect(a.legs[1].near).toBeNull();
  });

  it("leaves a leg alone when it does not start at the client or already has a near end", () => {
    const client = series([10], {}, "client");
    const own = series([99]);
    const conns = [connection([leg("client", "n", { near: own })]), connection([leg("relay", "n")], START + 1)];

    const out = withClientEnd(conns, client);

    expect(out[0].legs[0].near).toBe(own);
    expect(out[1].legs[0].near).toBeNull();
  });

  it("returns the connections unchanged without client stats, and never mutates them", () => {
    const conns = [connection([leg("client", "n")])];

    expect(withClientEnd(conns, null)).toEqual(conns);
    withClientEnd(conns, series([1], {}, "client"));
    expect(conns[0].legs[0].near).toBeNull();
  });
});

describe("summarizeLegs", () => {
  it("takes stall seconds from the end that saw more, and adds both ends' retransmits", () => {
    const [summary] = summarizeLegs([
      connection([
        leg("a", "b", {
          near: series([40, 40], { stallSecs: [1, 0], retransDelta: [5, 0] }),
          far: series([40, 40], { stallSecs: [2, 1], retransDelta: [1, 0] }),
        }),
      ]),
    ]);

    expect(summary.stallSecs).toBe(3);
    // Both ends watch the same silence, but each end retransmits its own direction.
    expect(summary.retransmits).toBe(6);
    expect(summary.ends.map((e) => e.end)).toEqual(["near", "far"]);
  });

  it("marks unmeasured legs as not measurable even if they carry stray data", () => {
    const [summary] = summarizeLegs([
      connection([leg("a", "b", { status: "unmeasured_no_flo_node", far: series([40]) })]),
    ]);

    expect(summary.measurable).toBe(false);
    expect(summary.statusText).toBe("Not measured: this relay runs HAProxy without flo-node");
  });

  it("marks a measured leg without any bucket as not measurable", () => {
    const [summary] = summarizeLegs([connection([leg("a", "b", { far: series([]) })])]);

    expect(summary.measurable).toBe(false);
  });
});

describe("selectWorstLeg", () => {
  function summaries(...legs: RelayLeg[]) {
    return summarizeLegs([connection(legs)]);
  }

  it("ranks by stall seconds first", () => {
    const worst = selectWorstLeg(summaries(
      leg("a", "b", { far: series([40, 2000], { retransDelta: [0, 9] }) }),
      leg("b", "c", { far: series([40, 41], { stallSecs: [0, 1] }) }),
    ));

    expect(worst).toBe(1);
  });

  it("ranks a leg retransmitting in both directions above a one-directional one with a higher single end", () => {
    const worst = selectWorstLeg(summaries(
      leg("a", "b", { near: series([40, 41], { retransDelta: [0, 5] }) }),
      leg("b", "c", { near: series([40, 41], { retransDelta: [0, 4] }), far: series([40, 41], { retransDelta: [4, 0] }) }),
    ));

    expect(worst).toBe(1);
  });

  it("breaks a stall tie by retransmits", () => {
    const worst = selectWorstLeg(summaries(
      leg("a", "b", { far: series([40, 41], { stallSecs: [1, 0], retransDelta: [1, 0] }) }),
      leg("b", "c", { far: series([40, 41], { stallSecs: [1, 0], retransDelta: [4, 0] }) }),
    ));

    expect(worst).toBe(1);
  });

  it("breaks a retransmit tie by the largest srtt jump over the leg's own p10", () => {
    // The second leg has the higher absolute srtt but a steady one; the first one jumped.
    const worst = selectWorstLeg(summaries(
      leg("a", "b", { far: series([20, 20, 20, 20, 20, 20, 20, 20, 20, 400]) }),
      leg("b", "c", { far: series([300, 300, 300, 300, 300, 300, 300, 300, 300, 310]) }),
    ));

    expect(worst).toBe(0);
  });

  it("never picks an unmeasured leg, however bad its numbers look", () => {
    const worst = selectWorstLeg(summaries(
      leg("a", "b", { far: series([40, 41], { stallSecs: [0, 1] }) }),
      leg("b", "c", { status: "expired", far: series([40, 4000], { stallSecs: [5, 5] }) }),
    ));

    expect(worst).toBe(0);
  });

  it("names no worst leg when every measured leg was clean", () => {
    // Pointing at an innocent hop is worse than pointing at none.
    const worst = selectWorstLeg(summaries(
      leg("a", "b", { far: series([40, 45, 60]) }),
      leg("b", "c", { far: series([190, 195, 200]) }),
    ));

    expect(worst).toBeNull();
  });

  it("still names a leg whose srtt jumped without stalls or retransmits", () => {
    const worst = selectWorstLeg(summaries(
      leg("a", "b", { far: series([40, 45, 60]) }),
      leg("b", "c", { far: series([190, 195, 900]) }),
    ));

    expect(worst).toBe(1);
  });

  it("returns null when no leg was measured", () => {
    expect(selectWorstLeg(summaries(leg("a", "b", { status: "node_too_old" })))).toBeNull();
    expect(selectWorstLeg([])).toBeNull();
  });

  it("names the eu-south-west → brazil-north leg in the StarBuck report", () => {
    const conns = withClientEnd(starbuckRelayChain.connections, clientTransportSeries(starbuckTransportStats, MATCH_START_MS));
    const legs = summarizeLegs(conns);

    const worst = selectWorstLeg(legs);

    expect(worst).not.toBeNull();
    expect(legs[worst!].label).toBe("eu-south-west → brazil-north");
  });
});

describe("roleText", () => {
  it("names where an end was measured, and shows an unknown role verbatim", () => {
    expect(roleText("haproxy_be")).toBe("HAProxy backend");
    expect(roleText("client")).toBe("client socket");
    expect(roleText("new_role")).toBe("new_role");
  });
});

describe("displayedEnds", () => {
  it("shows the client's own socket on a first leg whose relay end could not be measured", () => {
    const [summary] = summarizeLegs([
      connection([leg("client", "relay", { status: "expired", near: series([30, 31], {}, "client") })]),
    ]);

    expect(summary.measurable).toBe(false);
    expect(displayedEnds(summary).map((e) => e.role)).toEqual(["client"]);
  });

  it("hides stray relay data on an unmeasured leg", () => {
    const [summary] = summarizeLegs([connection([leg("a", "b", { status: "expired", far: series([40]) })])]);

    expect(displayedEnds(summary)).toEqual([]);
  });

  it("shows every end with data on a measured leg", () => {
    const [summary] = summarizeLegs([connection([leg("a", "b", { near: series([40]), far: series([41]) })])]);

    expect(displayedEnds(summary).map((e) => e.end)).toEqual(["near", "far"]);
  });
});

describe("retransmits not reported", () => {
  it("keeps a leg's retransmits unknown when no end reports them, and still ranks it on stalls", () => {
    const quic = series([40, 41], { retransDelta: [null, null], stallSecs: [0, 2] }, "node_quic");
    const legs = summarizeLegs([connection([leg("client", "node", { far: quic })])]);

    expect(legs[0].retransmits).toBeNull();
    expect(selectWorstLeg(legs)).toBe(0);
  });
});

describe("end transport", () => {
  it("names the transports a client slice actually used, falling back to the series kind", () => {
    const tcpThenQuic = { ...series([30, 31], {}, "client"), kind: "tcp", kinds: ["QUIC", "QUIC"] };
    const old = series([30], {}, "client");
    const [a, b] = summarizeLegs([
      connection([leg("client", "n", { near: tcpThenQuic })]),
      connection([leg("client", "n", { near: old })], START + 1),
    ]);

    expect(a.ends[0].kind).toBe("quic");
    expect(b.ends[0].kind).toBe("tcp");
  });

  it("lists both transports when a slice mixes them", () => {
    const mixed = { ...series([30, 31], {}, "client"), kinds: ["TCP", "QUIC"] };

    expect(summarizeLegs([connection([leg("client", "n", { near: mixed })])])[0].ends[0].kind).toBe("tcp+quic");
  });
});

describe("describeWorstLeg", () => {
  it("states every ranking input, including the srtt jump over the leg's own p10", () => {
    const legs = summarizeLegs([connection([leg("a", "b", { far: series([40, 45, 900]) })])]);

    expect(describeWorstLeg(legs[0])).toBe("a → b: 0 s stalled, 0 retransmits, srtt peaked 860 ms over its p10");
  });

  it("says retransmits were not reported rather than claiming none", () => {
    const quic = series([40, 41], { retransDelta: [null, null], stallSecs: [0, 2] }, "node_quic");
    const legs = summarizeLegs([connection([leg("client", "node", { far: quic })])]);

    expect(describeWorstLeg(legs[0])).toBe("client → node: 2 s stalled, retransmits not reported, srtt peaked 1 ms over its p10");
  });
});
