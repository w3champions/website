import type { IDisconnectEvent, IPlayerMatchTelemetry, IPlayerMatchTelemetryEntry } from "@/store/admin/playerMatchTelemetry/types";

interface IDeps {
  endpoint: string;
  fetch?: typeof globalThis.fetch;
}

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
  private readonly endpoint: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(deps: IDeps) {
    this.endpoint = deps.endpoint;
    this.fetchImpl = deps.fetch ?? globalThis.fetch;
  }

  async getByGame(token: string, gameId: number): Promise<IPlayerMatchTelemetry | null> {
    const url = `${this.endpoint}api/player-match-telemetry/by-game/${gameId}`;
    const res = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(
        `PlayerMatchTelemetryService.getByGame: HTTP ${res.status} for game ${gameId}`,
      );
    }
    const wire = (await res.json()) as IWireResponse;
    return toTelemetry(wire);
  }
}
