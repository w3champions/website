import { moduleActionContext } from "..";
import { MatchState } from "./types";
import { Match, RootState } from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    page: 0,
    totalMatches: 0,
    matches: [] as Match[]
  } as MatchState,
  actions: {
    async loadMatches(
      context: ActionContext<MatchState, RootState>,
      page?: number
    ) {
      const { commit, rootGetters, state } = moduleActionContext(context, mod);

      if (page != null && !isNaN(page)) {
        commit.SET_PAGE(page - 1);
      }

      const response = await rootGetters.matchService.retrieveMatches(
        state.page,
        10
      );

      commit.SET_TOTAL_MATCHES(response.length);
      commit.SET_MATCHES(response);
    }
  },
  mutations: {
    SET_PAGE(state: MatchState, page: number) {
      state.page = page;
    },
    SET_TOTAL_MATCHES(state: MatchState, totalMatches: number) {
      state.totalMatches = totalMatches;
    },
    SET_MATCHES(state: MatchState, matches: Match[]) {
      state.matches = matches;
    }
  }
} as const;

export default mod;
