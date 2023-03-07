import { GlobalSearchState, PlayerSearchData } from "./types";
import { defineStore } from "pinia";
import GlobalSearchService from "@/services/GlobalSearchService";

const PAGE_SIZE = 20;
const globalSearchService = new GlobalSearchService();

export const useGlobalSearchStore = defineStore("globalSearch", {
  state: (): GlobalSearchState => ({
    players: [],
    hasMore: false,
  }),
  actions: {
    async search(search: { searchText: string; append: boolean }) {
      const lastPlayerId = search.append && this.players.length > 0 ? this.players[this.players.length - 1].battleTag : "";
      const players = await globalSearchService.search(search.searchText, lastPlayerId, PAGE_SIZE);

      this.SET_PLAYERS({ players, append: search.append });
    },
    clearSearch() {
      this.SET_PLAYERS({ players: [], append: false });
    },
    SET_PLAYERS(payload: { players: PlayerSearchData[]; append: boolean }) {
      this.players = payload.append ? [...this.players, ...payload.players] : payload.players;
      this.hasMore = payload.players.length === PAGE_SIZE;
    }
  },
});
