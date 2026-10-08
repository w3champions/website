import { AuthorizedClient, type AuthorizedClientDeps } from "@/services/http/AuthorizedClient";
import type { CommercialLicenseTaggedPlayer, CommercialLicenseTagRequest } from "@/store/admin/commercialLicense/types";

/**
 * Admin API for commercial-license tagged players (contract C2).
 *
 * Takes its endpoint (and optionally a fetch) rather than importing API_URL, so
 * it can be constructed in tests - `@/config/env` reads `window` at module load
 * and cannot be imported outside a browser.
 */
export class CommercialLicenseService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  async getTaggedPlayers(token: string): Promise<CommercialLicenseTaggedPlayer[]> {
    return await this.client.getJson<CommercialLicenseTaggedPlayer[]>(this.path(), token);
  }

  /** Creates or updates; the backend preserves createdBy/createdAt on update. */
  async upsertTaggedPlayer(token: string, battleTag: string, request: CommercialLicenseTagRequest): Promise<CommercialLicenseTaggedPlayer> {
    return await this.client.requestJson<CommercialLicenseTaggedPlayer>("PUT", this.path(battleTag), token, request);
  }

  async removeTaggedPlayer(token: string, battleTag: string): Promise<void> {
    await this.client.requestVoid("DELETE", this.path(battleTag), token);
  }

  private path(battleTag?: string): string {
    const base = "api/admin/commercial-license/tagged-players";
    return battleTag === undefined ? base : `${base}/${encodeURIComponent(battleTag)}`;
  }
}
