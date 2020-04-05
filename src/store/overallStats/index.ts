import { moduleActionContext } from "..";
import {GameDay, OveralStatisticState} from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    loadingStats: false
  } as OveralStatisticState,
  actions: {
    async loadStatistics(
        context: ActionContext<OveralStatisticState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      commit.SET_LOADING_GAMES_PER_DAY(true);

      const games = await rootGetters.statisticService.retrieveGamesPerDay();

      commit.SET_GAMES_PER_DAY(games);
      commit.SET_LOADING_GAMES_PER_DAY(false);
    }
  },
  mutations: {
    SET_LOADING_GAMES_PER_DAY(state: OveralStatisticState, loading: boolean) {
      state.loadingStats = loading;
    },
    SET_GAMES_PER_DAY(state: OveralStatisticState, games: GameDay[]) {
      state.games = games;
    }
  }
} as const;

export default mod;
