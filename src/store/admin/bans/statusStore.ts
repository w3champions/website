import { defineStore } from "pinia";
import { BanAdminService } from "@/services/admin/BanAdminService";
import { useOauthStore } from "@/store/oauth/store";
import type { TagStatus } from "./types";

/** The contract's 1..100 per request. */
export const STATUS_BATCH_SIZE = 100;

export const useBanStatusStore = defineStore("banStatus", {
  state: (): { statuses: Record<string, TagStatus>; error: unknown } => ({ statuses: {}, error: null }),
  actions: {
    /** Distinct tags, batches of 100 in parallel, replaces the map; keyed by the tag as sent. */
    async load(battleTags: string[]): Promise<boolean> {
      const tags = [...new Set(battleTags)];
      // The answer may differ from the request in case only; the badge looks a tag up as the page has it.
      // An exact match wins, so tags that differ only in case each keep their own status.
      const sent = new Set(tags);
      const sentAs = new Map(tags.map((tag) => [tag.toLowerCase(), tag]));
      const batches: string[][] = [];
      for (let i = 0; i < tags.length; i += STATUS_BATCH_SIZE) batches.push(tags.slice(i, i + STATUS_BATCH_SIZE));
      try {
        const token = useOauthStore().token;
        const answers = (await Promise.all(batches.map((batch) => BanAdminService.status(batch, token)))).flat();
        this.statuses = Object.fromEntries(answers.map((s) => [sent.has(s.battleTag) ? s.battleTag : (sentAs.get(s.battleTag.toLowerCase()) ?? s.battleTag), s]));
        this.error = null;
        return true;
      } catch (e) {
        console.error("Loading the ban status failed:", e);
        this.statuses = {};
        this.error = e;
        return false;
      }
    },
  },
});
