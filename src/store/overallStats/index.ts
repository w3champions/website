import { moduleActionContext } from "..";
import {GameDay, OveralStatisticState, PlayersPerDay} from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    loadingGamesPerDayStats: false,
    loadingPlayersPerDayStats: false,
    gamesPerDay: [] as GameDay[],
    playersPerDay: [] as GameDay[]
  } as OveralStatisticState,
  actions: {
    async loadGamesPerDayStatistics(
        context: ActionContext<OveralStatisticState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      commit.SET_LOADING_GAMES_PER_DAY(true);

      const games = await rootGetters.statisticService.retrieveGamesPerDay();

      commit.SET_GAMES_PER_DAY(games);
      commit.SET_LOADING_GAMES_PER_DAY(false);
    },
    async loadPlayersPerDayStatistics(
        context: ActionContext<OveralStatisticState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      commit.SET_LOADING_PLAYERS_PER_DAY(true);

      const games = await rootGetters.statisticService.retrievePlayersPerDay();

      function mapToGameDay(r: PlayersPerDay): GameDay {
        return { date: r.date, gamesPlayed: r.distinctPlayers } as GameDay
      }

      const playersPerDay = games.map(r => mapToGameDay(r));
      commit.SET_PLAYERS_PER_DAY(playersPerDay);
      commit.SET_LOADING_PLAYERS_PER_DAY(false);
    }
  },
  mutations: {
    SET_LOADING_GAMES_PER_DAY(state: OveralStatisticState, loading: boolean) {
      state.loadingGamesPerDayStats = loading;
    },
    SET_GAMES_PER_DAY(state: OveralStatisticState, games: GameDay[]) {
      state.gamesPerDay = games;
    },
    SET_LOADING_PLAYERS_PER_DAY(state: OveralStatisticState, loading: boolean) {
      state.loadingPlayersPerDayStats = loading;
    },
    SET_PLAYERS_PER_DAY(state: OveralStatisticState, games: GameDay[]) {
      state.playersPerDay = games;
    }
  }
} as const;

export default mod;
