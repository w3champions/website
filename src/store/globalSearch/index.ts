import { moduleActionContext } from "..";
import { GlobalSearchState, PlayerSearchData } from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    players: [],
  } as GlobalSearchState,
  actions: {
    async search(
      context: ActionContext<GlobalSearchState, RootState>,
      searchText: string,
    ) {
      const { commit, rootGetters } = moduleActionContext(
        context,
        mod
      );

      const players = await rootGetters.globalSearchService.search(searchText);

      commit.SET_PLAYERS(players);
    },
    async clearSearch(context: ActionContext<GlobalSearchState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_PLAYERS([]);
    },
  },
  mutations: {
    SET_PLAYERS(state: GlobalSearchState, players: PlayerSearchData[]) {
      state.players = players;
    },
  },
} as const;

export default mod;
