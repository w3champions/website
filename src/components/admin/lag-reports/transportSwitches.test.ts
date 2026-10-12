import { describe, expect, it } from "vitest";
import { playerTransportSwitches, transportSwitchColor, transportSwitchIndicatorCount, transportSwitchLabel, transportSwitchReasonLabel, transportSwitchSemantic } from "./transportSwitches";
import { TransportSwitchData } from "@/store/admin/lagReports/types";

function sw(overrides: Partial<TransportSwitchData> = {}): TransportSwitchData {
  return {
    timestamp: "2026-10-11T18:40:00.5Z",
    gameTimeOffsetMs: 192500,
    from: "QUIC",
    to: "TCP",
    reason: "failover",
    ...overrides,
  };
}

describe("playerTransportSwitches", () => {
  it("returns the switches in order", () => {
    const list = [sw(), sw({ from: "TCP", to: "QUIC", reason: "upgrade" })];
    expect(playerTransportSwitches({ diagnostics: { transportSwitches: list } })).toEqual(list);
  });

  it("reads a report without the field as no switches", () => {
    expect(playerTransportSwitches({ diagnostics: {} })).toEqual([]);
    expect(playerTransportSwitches({ diagnostics: { transportSwitches: null } })).toEqual([]);
    expect(playerTransportSwitches({ diagnostics: null })).toEqual([]);
    expect(playerTransportSwitches({})).toEqual([]);
  });
});

describe("labels", () => {
  it("names the known reasons and shows an unknown one verbatim", () => {
    expect(transportSwitchReasonLabel("failover")).toBe("path lost");
    expect(transportSwitchReasonLabel("degraded")).toBe("QUIC too slow");
    expect(transportSwitchReasonLabel("upgrade")).toBe("QUIC works again");
    expect(transportSwitchReasonLabel("reconnect")).toBe("reconnect");
    expect(transportSwitchReasonLabel("some_future_reason")).toBe("some_future_reason");
  });

  it("writes the switch as from → to", () => {
    expect(transportSwitchLabel(sw())).toBe("QUIC → TCP");
  });
});

describe("transportSwitchColor", () => {
  it("is green for a move back to QUIC, red for a reconnect, amber otherwise", () => {
    expect(transportSwitchColor(sw({ from: "TCP", to: "QUIC", reason: "upgrade" }))).toBe("success");
    expect(transportSwitchColor(sw({ reason: "reconnect" }))).toBe("error");
    expect(transportSwitchColor(sw({ from: "TCP", to: "QUIC", reason: "reconnect" }))).toBe("error");
    expect(transportSwitchColor(sw())).toBe("warning");
    expect(transportSwitchColor(sw({ reason: "degraded" }))).toBe("warning");
  });
});

describe("transportSwitchIndicatorCount", () => {
  it("shows a positive count and nothing for zero or a missing field", () => {
    expect(transportSwitchIndicatorCount({ transportSwitchCount: 3 })).toBe(3);
    expect(transportSwitchIndicatorCount({ transportSwitchCount: 0 })).toBeNull();
    expect(transportSwitchIndicatorCount({})).toBeNull();
  });
});

describe("transportSwitchSemantic", () => {
  it("maps the chip colours onto the chart's warning/info/error set", () => {
    expect(transportSwitchSemantic(sw({ from: "TCP", to: "QUIC", reason: "upgrade" }))).toBe("info");
    expect(transportSwitchSemantic(sw({ reason: "reconnect" }))).toBe("error");
    expect(transportSwitchSemantic(sw())).toBe("warning");
  });
});
