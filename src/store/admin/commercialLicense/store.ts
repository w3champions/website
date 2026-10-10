import { defineStore } from "pinia";
import { API_URL } from "@/config/env";
import { useOauthStore } from "@/store/oauth/store";
import { CommercialLicenseService } from "@/services/admin/CommercialLicenseService";
import { commercialEventsService } from "@/store/admin/commercialEvents/service";
import { describeCommercialEventsError } from "@/store/admin/commercialEvents/errors";
import { keyedRequestSequence, requestSequence } from "@/store/admin/commercialEvents/latest";
import { roleHintsByBattleTag } from "@/store/admin/commercialEvents/roleHints";
import { describeError } from "./errors";
import type { CommercialLicenseState, CommercialLicenseTagRequest } from "./types";

// Lazy singleton: constructing at module-load time would read API_URL before the
// module graph has finished initializing. Defer to first call.
let _service: CommercialLicenseService | null = null;
function getService(): CommercialLicenseService {
  return _service ??= new CommercialLicenseService({ endpoint: API_URL });
}

// Only the newest list request may write the list.
const loads = requestSequence();
// Per battle tag: only the newest role-hint lookup may write that tag's hints.
const hintLoads = keyedRequestSequence();

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
      const request = loads.next();
      this.loading = true;
      this.loadError = "";
      try {
        const oauthStore = useOauthStore();
        const taggedPlayers = await getService().getTaggedPlayers(oauthStore.token);
        if (!loads.isLatest(request)) return;
        this.taggedPlayers = taggedPlayers;
      } catch (e) {
        // The service throws on a non-OK status; show it rather than an empty table.
        console.error("Failed to load commercial license tags:", e);
        if (loads.isLatest(request)) {
          this.loadError = describeError(e);
          this.taggedPlayers = [];
        }
        return;
      } finally {
        if (loads.isLatest(request)) this.loading = false;
      }
      await this.loadRoleHints(this.taggedPlayers.map((p) => p.battleTag), { full: true });
    },

    /**
     * Merges the role hints of the given tags; a failure only sets roleHintsError.
     * Only the `full` lookup of every listed tag clears that error.
     */
    async loadRoleHints(battleTags: string[], { full = false }: { full?: boolean } = {}): Promise<void> {
      if (battleTags.length === 0) return;
      if (full) this.roleHintsError = "";
      const requests = new Map(battleTags.map((battleTag) => [battleTag, hintLoads.next(battleTag)]));
      // A newer lookup of a tag supersedes this one for that tag, so an older answer cannot bring back a changed role.
      const latestTags = () => battleTags.filter((battleTag) => hintLoads.isLatest(battleTag, requests.get(battleTag) ?? -1));
      try {
        const hints = roleHintsByBattleTag(await commercialEventsService().getRoleHints(useOauthStore().token, battleTags));
        const current = Object.fromEntries(latestTags().filter((battleTag) => battleTag in hints).map((battleTag) => [battleTag, hints[battleTag]]));
        this.roleHints = { ...this.roleHints, ...current };
      } catch (e) {
        console.error("Failed to load commercial event role hints:", e);
        if (latestTags().length > 0) this.roleHintsError = describeCommercialEventsError(e);
      }
    },

    /** After a write applied locally: a list load already in flight may answer with the old state, so supersede it with a fresh one. */
    supersedePendingLoad(): void {
      if (this.loading) void this.load();
    },

    async upsert(battleTag: string, request: CommercialLicenseTagRequest): Promise<boolean> {
      this.saving = true;
      this.error = "";
      try {
        const oauthStore = useOauthStore();
        const saved = await getService().upsertTaggedPlayer(oauthStore.token, battleTag, request);
        this.taggedPlayers = [...this.taggedPlayers.filter((p) => p.battleTag !== saved.battleTag), saved];
        this.supersedePendingLoad();
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
        this.supersedePendingLoad();
        hintLoads.invalidate(battleTag);
        delete this.roleHints[battleTag];
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
