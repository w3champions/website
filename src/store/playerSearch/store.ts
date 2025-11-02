import { PlayerSearchState } from "./types";
import { defineStore } from "pinia";
import ProfileService from "@/services/ProfileService";
import { PlayerProfile } from "@/store/player/types";

export const usePlayerSearchStore = defineStore("playerSearch", {
  state: (): PlayerSearchState => ({
    searchedPlayers: [],
  }),
  actions: {
    async searchBnetTag(search: { searchText: string }) {
      const searchedPlayers = await ProfileService.searchPlayer(search.searchText);
      this.SET_SEARCH_FOR_BNET_TAG(searchedPlayers);
    },
    // TODO: I don't think this is needed anymore. Searched players should be set inside the player-search component
    async clearPlayerSearch() {
      this.SET_SEARCH_FOR_BNET_TAG([]);
    },
    SET_SEARCH_FOR_BNET_TAG(searchedPlayers: PlayerProfile[]): void {
      this.searchedPlayers = searchedPlayers;
    },
  },
});
