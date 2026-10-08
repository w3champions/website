import { defineStore } from "pinia";
import { API_URL } from "@/config/env";
import { useOauthStore } from "@/store/oauth/store";
import { CommercialLicenseService } from "@/services/admin/CommercialLicenseService";
import type { CommercialLicenseState, CommercialLicenseTaggedPlayer, CommercialLicenseTagRequest } from "./types";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing. Defer to first call.
let _service: CommercialLicenseService | null = null;
function getService(): CommercialLicenseService {
  return _service ??= new CommercialLicenseService({ endpoint: API_URL });
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function sortByBattleTag(players: CommercialLicenseTaggedPlayer[]): CommercialLicenseTaggedPlayer[] {
  return [...players].sort((a, b) => a.battleTag.localeCompare(b.battleTag));
}

export const useCommercialLicenseStore = defineStore("commercialLicense", {
  state: (): CommercialLicenseState => ({
    taggedPlayers: [],
    loading: false,
    saving: false,
    error: "",
  }),

  actions: {
    async load(): Promise<void> {
      this.loading = true;
      this.error = "";
      try {
        const oauthStore = useOauthStore();
        this.taggedPlayers = await getService().getTaggedPlayers(oauthStore.token);
      } catch (e) {
        // The service throws on a non-OK status; show it rather than an empty table.
        this.error = messageOf(e);
        this.taggedPlayers = [];
      } finally {
        this.loading = false;
      }
    },

    async upsert(battleTag: string, request: CommercialLicenseTagRequest): Promise<boolean> {
      this.saving = true;
      this.error = "";
      try {
        const oauthStore = useOauthStore();
        const saved = await getService().upsertTaggedPlayer(oauthStore.token, battleTag, request);
        this.taggedPlayers = sortByBattleTag([...this.taggedPlayers.filter((p) => p.battleTag !== saved.battleTag), saved]);
        return true;
      } catch (e) {
        this.error = messageOf(e);
        return false;
      } finally {
        this.saving = false;
      }
    },

    async remove(battleTag: string): Promise<boolean> {
      this.saving = true;
      this.error = "";
      try {
        const oauthStore = useOauthStore();
        await getService().removeTaggedPlayer(oauthStore.token, battleTag);
        this.taggedPlayers = this.taggedPlayers.filter((p) => p.battleTag !== battleTag);
        return true;
      } catch (e) {
        this.error = messageOf(e);
        return false;
      } finally {
        this.saving = false;
      }
    },
  },
});
