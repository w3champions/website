import { describe, expect, it } from "vitest";
import { type ConnectionEventData, EConnectionEventType } from "@/store/admin/lagReports/types";
import type { SemanticColors } from "@/helpers/lag-report-colors";
import { buildEventMarkers, formatGameTime, type MarkerPlayer, stackedMarkerLines } from "./chartMarkers";

const AT = Date.UTC(2026, 9, 8, 21, 2, 10);
const style = (border: string) => ({ border, bgColor: border, textColor: border });
const chipColors: SemanticColors = { warning: style("warn"), info: style("info"), error: style("err") };

function ce(eventType: EConnectionEventType, durationMs: number | null = null): ConnectionEventData {
  return { timestamp: new Date(AT).toISOString(), gameTimeOffsetMs: 60_000, eventType, durationMs };
}

function player(battleTag: string, connectionEvents: ConnectionEventData[], lagAt: number[] = []): MarkerPlayer {
  return {
    battleTag,
    diagnostics: {
      connectionEvents,
      lagEvents: lagAt.map((t) => ({ timestamp: new Date(t).toISOString(), gameTimeOffsetMs: 30_000, annotation: null })),
    },
  };
}

const all = { includeLagEvents: () => true, includeConnectionEvent: () => true };

describe("buildEventMarkers", () => {
  it("adds the player's transport switches with the reason, following the player's own filter", () => {
    const switchAt = (to: string, reason: string) => ({ timestamp: new Date(AT).toISOString(), gameTimeOffsetMs: 192_500, from: to === "TCP" ? "QUIC" : "TCP", to, reason });
    const players: MarkerPlayer[] = [
      { ...player("me#1", []), diagnostics: { ...player("me#1", []).diagnostics, transportSwitches: [switchAt("TCP", "failover"), switchAt("QUIC", "upgrade")] } },
      { ...player("you#2", []), diagnostics: { ...player("you#2", []).diagnostics, transportSwitches: [switchAt("TCP", "reconnect")] } },
      player("old#3", []),
    ];

    const markers = buildEventMarkers(players, { chipColors, playerColors: ["#ef5350", "#42a5f5", "#66bb6a"], ...all, includeLagEvents: (pi) => pi !== 1 });

    expect(markers.map((m) => [m.id, m.shortLabel, m.style.border, m.dashed])).toEqual([
      ["switch-0", "QUIC → TCP (me)", "warn", true],
      ["switch-1", "TCP → QUIC (me)", "info", true],
    ]);
    expect(markers[0].detailLines).toEqual(["Game 3:12", `At ${new Date(AT).toLocaleTimeString()}`, "Why: path lost"]);
  });

  it("adds the disconnect that preceded a reconnect", () => {
    const markers = buildEventMarkers([player("me#1", [ce(EConnectionEventType.Reconnect, 4_000)])], {
      chipColors,
      playerColors: ["#ef5350"],
      ...all,
    });

    expect(markers.map((m) => [m.id, m.ts, m.shortLabel, m.style.border])).toEqual([
      ["disc-0", AT - 4_000, "Disconnected (me)", "err"],
      ["conn-0", AT, "Reconnected (me)", "warn"],
    ]);
  });

  it("colours lag reports with the player's colour and keeps ids unique across players", () => {
    const markers = buildEventMarkers(
      [player("me#1", [], [AT]), player("opp#2", [ce(EConnectionEventType.GameResumed, 30_000)])],
      { chipColors, playerColors: ["#ef5350", "#42a5f5"], ...all },
    );

    expect(markers.map((m) => m.id)).toEqual(["lag-0", "conn-1"]);
    expect(markers[0].style.border).toBe("rgb(239,83,80)");
    expect(markers[1].style.border).toBe("info");
  });

  it("lets the caller choose which events become markers", () => {
    const markers = buildEventMarkers(
      [
        player("me#1", [ce(EConnectionEventType.StartLag)], [AT]),
        player("opp#2", [ce(EConnectionEventType.GamePaused), ce(EConnectionEventType.StartLag)], [AT]),
      ],
      {
        chipColors,
        playerColors: ["#ef5350", "#42a5f5"],
        includeLagEvents: (pi) => pi === 0,
        includeConnectionEvent: (pi, e) => pi === 0 || e.eventType === EConnectionEventType.GamePaused,
      },
    );

    expect(markers.map((m) => m.shortLabel)).toEqual(["-lag (me)", "Lag detected (me)", "Game paused (opp)"]);
  });
});

describe("stackedMarkerLines", () => {
  it("lists every marker on the spot without repeating the shared lines", () => {
    const lines = stackedMarkerLines([
      { shortLabel: "Reconnected (Chico)", detailLines: ["Game 14:02", "At 8:50:50 PM"] },
      { shortLabel: "QUIC → TCP (Chico)", detailLines: ["Game 14:02", "At 8:50:50 PM", "Why: reconnect"] },
    ]);
    expect(lines).toEqual(["Reconnected (Chico)", "Game 14:02", "At 8:50:50 PM", "QUIC → TCP (Chico)", "Why: reconnect"]);
  });

  it("drops a marker that would add nothing", () => {
    const disconnected = { shortLabel: "Disconnected (Chico)", detailLines: ["Game 13:58", "At 8:50:46 PM"] };
    expect(stackedMarkerLines([disconnected, { ...disconnected }])).toEqual(["Disconnected (Chico)", "Game 13:58", "At 8:50:46 PM"]);
  });
});

describe("formatGameTime", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(formatGameTime(61_500)).toBe("1:01");
  });
});
