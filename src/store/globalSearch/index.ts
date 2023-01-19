import { moduleActionContext } from "..";
import { GlobalSearchState, PlayerSearchData } from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";

const PAGE_SIZE = 20;

const mod = {
  namespaced: true,
  state: {
    players: [],
    hasMore: false,
  } as GlobalSearchState,
  actions: {
    async search(
      context: ActionContext<GlobalSearchState, RootState>,
      search: { searchText: string; append: boolean }
    ) {
      const { state, commit, rootGetters } = moduleActionContext(context, mod);

      const lastPlayerId = search.append && state.players.length > 0 ? state.players[state.players.length - 1].battleTag : "";
      const players = await rootGetters.globalSearchService.search(search.searchText, lastPlayerId, PAGE_SIZE);

      commit.SET_PLAYERS({ players, append: search.append });
    },
    async clearSearch(context: ActionContext<GlobalSearchState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_PLAYERS({ players: [], append: false });
    },
  },
  mutations: {
    SET_PLAYERS(state: GlobalSearchState, payload: { players: PlayerSearchData[]; append: boolean }) {
      if (payload.append) {
        state.players = [...state.players, ...payload.players];
      } else {
        state.players = payload.players;
      }
      state.hasMore = payload.players.length === PAGE_SIZE;
    },
  },
} as const;

export default mod;
