import { defineStore } from "pinia";
import { API_URL } from "@/config/env";
import { useOauthStore } from "@/store/oauth/store";
import { CommercialLicenseService } from "@/services/admin/CommercialLicenseService";
import { commercialEventsService } from "@/store/admin/commercialEvents/service";
import { describeCommercialEventsError } from "@/store/admin/commercialEvents/errors";
import { roleHintsByBattleTag } from "@/store/admin/commercialEvents/roleHints";
import { describeError } from "./errors";
import type { CommercialLicenseState, CommercialLicenseTagRequest } from "./types";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing. Defer to first call.
let _service: CommercialLicenseService | null = null;
function getService(): CommercialLicenseService {
  return _service ??= new CommercialLicenseService({ endpoint: API_URL });
}

export const useCommercialLicenseStore = defineStore("commercialLicense", {
  state: (): CommercialLicenseState => ({
    taggedPlayers: [],
    loading: false,
    saving: false,
    error: "",
    loadError: "",
    roleHints: {},
    roleHintsError: "",
  }),

  actions: {
    async load(): Promise<void> {
      this.loading = true;
      this.loadError = "";
      try {
        const oauthStore = useOauthStore();
        this.taggedPlayers = await getService().getTaggedPlayers(oauthStore.token);
      } catch (e) {
        // The service throws on a non-OK status; show it rather than an empty table.
        console.error("Failed to load commercial license tags:", e);
        this.loadError = describeError(e);
        this.taggedPlayers = [];
        return;
      } finally {
        this.loading = false;
      }
      await this.loadRoleHints(this.taggedPlayers.map((p) => p.battleTag));
    },

    /** Merges the role hints of the given tags; a failure only sets roleHintsError. */
    async loadRoleHints(battleTags: string[]): Promise<void> {
      if (battleTags.length === 0) return;
      this.roleHintsError = "";
      try {
        const hints = await commercialEventsService().getRoleHints(useOauthStore().token, battleTags);
        this.roleHints = { ...this.roleHints, ...roleHintsByBattleTag(hints) };
      } catch (e) {
        console.error("Failed to load commercial event role hints:", e);
        this.roleHintsError = describeCommercialEventsError(e);
      }
    },

    async upsert(battleTag: string, request: CommercialLicenseTagRequest): Promise<boolean> {
      this.saving = true;
      this.error = "";
      try {
        const oauthStore = useOauthStore();
        const saved = await getService().upsertTaggedPlayer(oauthStore.token, battleTag, request);
        this.taggedPlayers = [...this.taggedPlayers.filter((p) => p.battleTag !== saved.battleTag), saved];
        void this.loadRoleHints([saved.battleTag]);
        return true;
      } catch (e) {
        console.error("Commercial license request failed:", e);
        this.error = describeError(e);
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
        console.error("Commercial license request failed:", e);
        this.error = describeError(e);
        return false;
      } finally {
        this.saving = false;
      }
    },
  },
});
