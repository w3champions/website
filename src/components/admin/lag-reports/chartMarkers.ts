import { type ConnectionEventData, EConnectionEventType, type LagEvent } from "@/store/admin/lagReports/types";
import { type LagAnnotationStyle, playerColorTonalStyle, type SemanticColors } from "@/helpers/lag-report-colors";

export type EventMarkerInfo = {
  id: string;
  ts: number;
  shortLabel: string;
  detailLines: string[];
  style: LagAnnotationStyle;
  dashed?: boolean;
};

export interface MarkerPlayer {
  battleTag: string;
  diagnostics: { lagEvents: LagEvent[]; connectionEvents: ConnectionEventData[] };
}

export interface MarkerOptions {
  chipColors: SemanticColors;
  playerColors: string[];
  includeLagEvents: (playerIndex: number) => boolean;
  includeConnectionEvent: (playerIndex: number, event: ConnectionEventData) => boolean;
}

export const CONNECTION_EVENT_LABELS: Record<string, string> = {
  [EConnectionEventType.Reconnect]: "Reconnected",
  [EConnectionEventType.FailureDisconnect]: "Disconnected",
  [EConnectionEventType.GameCrashed]: "Game crashed",
  [EConnectionEventType.GamePaused]: "Game paused",
  [EConnectionEventType.GameResumed]: "Game resumed",
  [EConnectionEventType.StartLag]: "Lag detected",
  [EConnectionEventType.StopLag]: "Lag resolved",
};

const WARNING_EVENTS = [EConnectionEventType.Reconnect, EConnectionEventType.GamePaused, EConnectionEventType.StartLag];
const INFO_EVENTS = [EConnectionEventType.GameResumed, EConnectionEventType.StopLag];

export function playerName(battleTag: string): string {
  return battleTag.split("#")[0];
}

export function formatGameTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function formatWallClock(ms: number): string {
  return new Date(ms).toLocaleTimeString();
}

function semanticKey(eventType: EConnectionEventType): keyof SemanticColors {
  if (WARNING_EVENTS.includes(eventType)) return "warning";
  if (INFO_EVENTS.includes(eventType)) return "info";
  return "error";
}

/** Vertical chart markers for lag reports and connection events, in player order. */
export function buildEventMarkers(players: MarkerPlayer[], opts: MarkerOptions): EventMarkerInfo[] {
  const markers: EventMarkerInfo[] = [];
  let idx = 0;

  players.forEach((player, pi) => {
    const pName = playerName(player.battleTag);
    const pStyle = playerColorTonalStyle(opts.playerColors[pi % opts.playerColors.length]);

    if (opts.includeLagEvents(pi)) {
      for (const le of player.diagnostics.lagEvents) {
        const ts = new Date(le.timestamp).getTime();
        markers.push({
          id: `lag-${idx}`,
          ts,
          shortLabel: `-lag (${pName})`,
          detailLines: [`Game ${formatGameTime(le.gameTimeOffsetMs)}`, `At ${formatWallClock(ts)}`],
          style: pStyle,
        });
        idx++;
      }
    }

    for (const ce of player.diagnostics.connectionEvents) {
      if (!opts.includeConnectionEvent(pi, ce)) continue;
      const ts = new Date(ce.timestamp).getTime();

      if (ce.eventType === EConnectionEventType.Reconnect && ce.durationMs) {
        const disconnectTs = ts - ce.durationMs;
        const disconnectGameMs = Math.max(0, ce.gameTimeOffsetMs - ce.durationMs);
        markers.push({
          id: `disc-${idx}`,
          ts: disconnectTs,
          shortLabel: `Disconnected (${pName})`,
          detailLines: [`Game ${formatGameTime(disconnectGameMs)}`, `At ${formatWallClock(disconnectTs)}`],
          style: opts.chipColors.error,
        });
      }

      markers.push({
        id: `conn-${idx}`,
        ts,
        shortLabel: `${CONNECTION_EVENT_LABELS[ce.eventType] ?? ce.eventType} (${pName})`,
        detailLines: [`Game ${formatGameTime(ce.gameTimeOffsetMs)}`, `At ${formatWallClock(ts)}`],
        style: opts.chipColors[semanticKey(ce.eventType)],
        dashed: true,
      });
      idx++;
    }
  });

  return markers;
}
