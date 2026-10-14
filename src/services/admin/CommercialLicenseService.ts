import { AuthorizedClient, type AuthorizedClientDeps } from "@/services/http/AuthorizedClient";
import { type CommercialLicenseTaggedPlayerWire, normalizeTag } from "@/store/admin/commercialLicense/restrictions";
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
    const raw = await this.client.getJson<CommercialLicenseTaggedPlayerWire[]>(this.path(), token);
    return raw.map(normalizeTag);
  }

  /** Creates or updates; the backend preserves createdBy/createdAt on update. */
  async upsertTaggedPlayer(token: string, battleTag: string, request: CommercialLicenseTagRequest): Promise<CommercialLicenseTaggedPlayer> {
    const raw = await this.client.requestJson<CommercialLicenseTaggedPlayerWire>("PUT", this.path(battleTag), token, request);
    return normalizeTag(raw);
  }

  async removeTaggedPlayer(token: string, battleTag: string): Promise<void> {
    await this.client.requestVoid("DELETE", this.path(battleTag), token);
  }

  private path(battleTag?: string): string {
    const base = "api/admin/commercial-license/tagged-players";
    return battleTag === undefined ? base : `${base}/${encodeURIComponent(battleTag)}`;
  }
}
