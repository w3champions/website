import type { IPlayerMatchTelemetry } from "@/store/admin/playerMatchTelemetry/types";

interface IDeps {
  endpoint: string;
  fetch?: typeof globalThis.fetch;
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
    return (await res.json()) as IPlayerMatchTelemetry;
  }
}
