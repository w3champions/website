import { PlayerSearchState } from "./types";
import { defineStore } from "pinia";
import ProfileService from "@/services/ProfileService";
import { PlayerProfile } from "@/store/player/types";

export const usePlayerSearchStore = defineStore("playerSearch", {
  state: (): PlayerSearchState => ({
    searchedPlayers: [],
    playerSearchModel: "",
  }),
  actions: {
    async searchBnetTag(search: { searchText: string }) {
      const searchedPlayers = await ProfileService.searchPlayer(search.searchText);
      this.SET_SEARCH_FOR_BNET_TAG(searchedPlayers);
    },
    setPlayerSearchModel(val: string) {
      this.SET_PLAYER_SEARCH_MODEL(val);
    },
    async clearPlayerSearch() {
      this.SET_SEARCH_FOR_BNET_TAG([]);
      this.SET_PLAYER_SEARCH_MODEL("");
    },
    getSearchModel(): string {
      return this.playerSearchModel;
    },
    SET_SEARCH_FOR_BNET_TAG(searchedPlayers: PlayerProfile[]): void {
      this.searchedPlayers = searchedPlayers;
    },
    SET_PLAYER_SEARCH_MODEL(val: string): void {
      this.playerSearchModel = val;
    },
  },
});
