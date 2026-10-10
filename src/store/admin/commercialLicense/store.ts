import { defineStore } from "pinia";
import { API_URL } from "@/config/env";
import { useOauthStore } from "@/store/oauth/store";
import { CommercialLicenseService } from "@/services/admin/CommercialLicenseService";
import { commercialEventsService } from "@/store/admin/commercialEvents/service";
import { describeCommercialEventsError } from "@/store/admin/commercialEvents/errors";
import { keyedRequestSequence, loadLatest, requestSequence } from "@/store/admin/commercialEvents/latest";
import { roleHintsByBattleTag } from "@/store/admin/commercialEvents/roleHints";
import { resetKeepingWrite, runAdminWrite } from "@/store/admin/commercialEvents/write";
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
// One number per page visit: a write that settles after its page was left drops its error and reload.
const visits = requestSequence();

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
    /** Then looks up the role hints of every listed tag. Resolves to whether the list request succeeded. */
    async load(): Promise<boolean> {
      this.loadError = "";
      let applied = false;
      const listed = await loadLatest(loads, {
        what: "commercial license tags",
        setLoading: (loading) => (this.loading = loading),
        fetch: () => getService().getTaggedPlayers(useOauthStore().token),
        apply: (taggedPlayers) => {
          this.taggedPlayers = taggedPlayers;
          applied = true;
        },
        // The service throws on a non-OK status; show it rather than an empty table.
        fail: (e) => {
          this.loadError = describeError(e);
          this.taggedPlayers = [];
        },
      });
      if (applied) await this.loadRoleHints(this.taggedPlayers.map((p) => p.battleTag), { full: true });
      return listed;
    },

    /** Drops the list, the hints and every pending load; a write in flight stays marked. */
    clear(): void {
      loads.invalidate();
      hintLoads.clear();
      visits.invalidate();
      resetKeepingWrite(this);
    },

    /** The page was left: writes still in flight no longer report into it. */
    endVisit(): void {
      visits.invalidate();
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
      const saved = await runAdminWrite(this, describeError, () => getService().upsertTaggedPlayer(useOauthStore().token, battleTag, request), () => this.load(), visits);
      if (!saved) return false;
      this.taggedPlayers = [...this.taggedPlayers.filter((p) => p.battleTag !== saved.battleTag), saved];
      this.supersedePendingLoad();
      void this.loadRoleHints([saved.battleTag]);
      return true;
    },

    async remove(battleTag: string): Promise<boolean> {
      const removed = await runAdminWrite(this, describeError, () => getService().removeTaggedPlayer(useOauthStore().token, battleTag).then(() => true), () => this.load(), visits);
      if (!removed) return false;
      this.taggedPlayers = this.taggedPlayers.filter((p) => p.battleTag !== battleTag);
      this.supersedePendingLoad();
      hintLoads.invalidate(battleTag);
      delete this.roleHints[battleTag];
      return true;
    },
  },
});
