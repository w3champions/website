import { defineStore } from "pinia";
import ReplayStoreService from "@/services/ReplayStoreService";

/** For the account menu: it links to the replay purchases only when the user has some. */
export const useReplayPurchasesStore = defineStore("replayPurchases", {
  state: () => ({ count: 0 }),
  actions: {
    async load(token: string) {
      if (!token) {
        this.count = 0;
        return;
      }
      try {
        this.count = await ReplayStoreService.countPurchases(token);
      } catch {
        // Only the menu link depends on the count: the user sees no error, and the last count stays.
      }
    },
  },
});
