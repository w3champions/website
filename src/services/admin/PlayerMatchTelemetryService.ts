import type { IDisconnectEvent, IPlayerMatchTelemetry, IPlayerMatchTelemetryEntry } from "@/store/admin/playerMatchTelemetry/types";
import { AuthorizedClient, type AuthorizedClientDeps } from "@/services/http/AuthorizedClient";

// Wire shape (ISO-8601 timestamps on the wire; we parse them into Date below).
interface IWireDisconnectEvent {
  startedAt: string;
  durationMs: number;
}

interface IWireEntry extends
  Omit<
    IPlayerMatchTelemetryEntry,
    "crashedAt" | "disconnectEvents" | "submittedAt"
  >
{
  crashedAt: string | null;
  disconnectEvents: IWireDisconnectEvent[];
  submittedAt: string;
}

interface IWireResponse extends
  Omit<
    IPlayerMatchTelemetry,
    "matchWallStart" | "players" | "createdAt" | "expiresAt"
  >
{
  matchWallStart: string;
  players: IWireEntry[];
  createdAt: string;
  expiresAt: string;
}

function toEntry(wire: IWireEntry): IPlayerMatchTelemetryEntry {
  return {
    ...wire,
    crashedAt: wire.crashedAt === null ? null : new Date(wire.crashedAt),
    disconnectEvents: wire.disconnectEvents.map(
      (d): IDisconnectEvent => ({
        startedAt: new Date(d.startedAt),
        durationMs: d.durationMs,
      }),
    ),
    submittedAt: new Date(wire.submittedAt),
  };
}

function toTelemetry(wire: IWireResponse): IPlayerMatchTelemetry {
  return {
    gameId: wire.gameId,
    matchWallStart: new Date(wire.matchWallStart),
    players: wire.players.map(toEntry),
    createdAt: new Date(wire.createdAt),
    expiresAt: new Date(wire.expiresAt),
  };
}

export class PlayerMatchTelemetryService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  async getByGame(token: string, gameId: number): Promise<IPlayerMatchTelemetry | null> {
    // 404 is a normal outcome here: telemetry is submitted separately from the
    // lag report, so a game can legitimately have none. Every other non-OK
    // status throws, so a broken request is never mistaken for absent data.
    const wire = await this.client.getJsonOrNull<IWireResponse>(
      `api/player-match-telemetry/by-game/${gameId}`,
      token,
    );
    return wire === null ? null : toTelemetry(wire);
  }
}
