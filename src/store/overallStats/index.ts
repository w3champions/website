import { moduleActionContext } from "..";
import {GameDay, OveralStatisticState, PlayersPerDay, StatsPerMapAndRace} from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    loadingGamesPerDayStats: false,
    loadingMapAndRaceStats: false,
    loadingPlayersPerDayStats: false,
    gamesPerDay: [] as GameDay[],
    playersPerDay: [] as GameDay[],
    statsPerMapAndRace: {} as StatsPerMapAndRace
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
    },
    async loadMapAndRaceStatistics(
        context: ActionContext<OveralStatisticState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      commit.SET_LOADING_MAP_AND_RACE_STATS(true);

      const stats = await rootGetters.statisticService.retrieveMapAndRaceStats();

      commit.SET_MAP_AND_RACE_STATS(stats);
      commit.SET_LOADING_MAP_AND_RACE_STATS(false);
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
    },
    SET_LOADING_MAP_AND_RACE_STATS(state: OveralStatisticState, loading: boolean) {
      state.loadingMapAndRaceStats = loading;
    },
    SET_MAP_AND_RACE_STATS(state: OveralStatisticState, stats: StatsPerMapAndRace) {
      state.statsPerMapAndRace = stats
    }
  }
} as const;

export default mod;
