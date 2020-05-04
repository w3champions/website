import { moduleActionContext } from "..";
import {
  GameDay,
  GameLength,
  OveralStatisticState,
  PlayedHeroByMode,
  PlayersPerDay,
  PopularGameHour,
  StatsPerMapAndRace
} from "./types";
import {EGameMode, RootState} from "../typings";
import { ActionContext } from "vuex";

const mod = {
  namespaced: true,
  state: {
    loadingGamesPerDayStats: true,
    loadingMapAndRaceStats: true,
    loadingPlayersPerDayStats: true,
    gamesPerDay: [] as GameDay[],
    playersPerDay: [] as GameDay[],
    statsPerMapAndRace: [] as StatsPerMapAndRace[],
    gameLengths: [] as GameLength[],
    popularGameHours: [] as PopularGameHour[],
    playedHeroes: [] as PlayedHeroByMode[],
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
    },
    async loadGameLengthStatistics(
        context: ActionContext<OveralStatisticState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const stats = await rootGetters.statisticService.retrieveGameTimes();

      commit.SET_GAME_LENGTH_STATS(stats);
    },
    async loadPlayedHeroes(
        context: ActionContext<OveralStatisticState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const stats = await rootGetters.statisticService.retrievePlayedHeroes();

      commit.SET_PLAYED_HEROES(stats);
    },
    async loadpopularGameHours(
        context: ActionContext<OveralStatisticState, RootState>
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const stats = await rootGetters.statisticService.retrievePopularGameHours();

      commit.SET_POPULAR_GAME_HOURS(stats);
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
    SET_MAP_AND_RACE_STATS(state: OveralStatisticState, stats: StatsPerMapAndRace[]) {
      state.statsPerMapAndRace = stats
    },
    SET_GAME_LENGTH_STATS(state: OveralStatisticState, stats: GameLength[]) {
      state.gameLengths = stats
    },
    SET_POPULAR_GAME_HOURS(state: OveralStatisticState, stats: PopularGameHour[]) {
      state.popularGameHours = stats
    },
    SET_PLAYED_HEROES(state: OveralStatisticState, playedHeroes: PlayedHeroByMode[]) {
      state.playedHeroes = playedHeroes
    }
  }
} as const;

export default mod;
