import { moduleActionContext } from "..";
import {
  GameDay,
  GameDayPerMode,
  GameLength,
  HeroPick,
  MatchesOnMapPerSeason,
  MmrDistribution,
  OverallStatisticState,
  PlayedHeroByMode,
  PlayersPerDay,
  PopularGameHour,
  SeasonGameModeGateWayForMMR,
  StatsPerWinrate,
  WinLoss,
} from "./types";
import { ERaceEnum, RootState } from "../typings";
import { ActionContext } from "vuex";
import StatisticService from "@/services/StatisticService";

const mod = {
  namespaced: true,
  state: {
    loadingGamesPerDayStats: true,
    loadingMapAndRaceStats: true,
    loadingPlayersPerDayStats: true,
    gamesPerDay: [[]] as GameDayPerMode[][],
    playersPerDay: [] as GameDay[],
    statsPerMapAndRace: [] as StatsPerWinrate[],
    gameLengths: [] as GameLength[],
    popularGameHours: [] as PopularGameHour[],
    playedHeroes: [] as PlayedHeroByMode[],
    matchesOnMapPerSeason: [] as MatchesOnMapPerSeason[],
    heroWinrate: {} as WinLoss,
    mmrDistribution: {} as MmrDistribution,
    heroPicks: [
      {
        name: "anyhero",
        heroId: "all",
        race: ERaceEnum.TOTAL,
      },
      {
        name: "anyhero",
        heroId: "all",
        race: ERaceEnum.TOTAL,
      },
      {
        name: "anyhero",
        heroId: "all",
        race: ERaceEnum.TOTAL,
      },
      {
        name: "anyhero",
        heroId: "all",
        race: ERaceEnum.TOTAL,
      },
      {
        name: "anyhero",
        heroId: "all",
        race: ERaceEnum.TOTAL,
      },
      {
        name: "anyhero",
        heroId: "all",
        race: ERaceEnum.TOTAL,
      },
    ] as HeroPick[],
  } as OverallStatisticState,
  actions: {
    async loadGamesPerDayStatistics(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      commit.SET_LOADING_GAMES_PER_DAY(true);

      const games = await StatisticService.retrieveGamesPerDay();

      commit.SET_GAMES_PER_DAY(games);
      commit.SET_LOADING_GAMES_PER_DAY(false);
    },
    async loadMapsPerSeason(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      const games = await StatisticService.retrieveMapsPerSeason();

      commit.SET_MAPS_PER_SEASON(games);
    },
    async loadPlayersPerDayStatistics(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      commit.SET_LOADING_PLAYERS_PER_DAY(true);

      const games = await StatisticService.retrievePlayersPerDay();

      function mapToGameDay(r: PlayersPerDay): GameDay {
        return { date: r.date, gamesPlayed: r.distinctPlayers } as GameDay;
      }

      const playersPerDay = games.map((r) => mapToGameDay(r));
      commit.SET_PLAYERS_PER_DAY(playersPerDay);
      commit.SET_LOADING_PLAYERS_PER_DAY(false);
    },
    async loadMapAndRaceStatistics(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      commit.SET_LOADING_MAP_AND_RACE_STATS(true);

      const stats = await StatisticService.retrieveMapAndRaceStats();

      commit.SET_MAP_AND_RACE_STATS(stats);
      commit.SET_LOADING_MAP_AND_RACE_STATS(false);
    },
    async loadGameLengthStatistics(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      const stats = await StatisticService.retrieveGameTimes();

      commit.SET_GAME_LENGTH_STATS(stats);
    },
    async loadPlayedHeroes(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      const stats = await StatisticService.retrievePlayedHeroes();

      commit.SET_PLAYED_HEROES(stats);
    },
    async loadpopularGameHours(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      const stats = await StatisticService.retrievePopularGameHours();

      commit.SET_POPULAR_GAME_HOURS(stats);
    },
    async loadHeroWinrates(context: ActionContext<OverallStatisticState, RootState>) {
      const { commit, state } = moduleActionContext(context, mod);

      const stats = await StatisticService.retrieveHeroWinrates(
        state.heroPicks[0].heroId,
        state.heroPicks[1].heroId,
        state.heroPicks[2].heroId,
        state.heroPicks[3].heroId,
        state.heroPicks[4].heroId,
        state.heroPicks[5].heroId
      );

      commit.SET_HERO_WINRATES(stats);
    },
    async loadMmrDistribution(
      context: ActionContext<OverallStatisticState, RootState>,
      payload: SeasonGameModeGateWayForMMR
    ) {
      const { commit } = moduleActionContext(context, mod);

      const stats = await StatisticService.retrieveMmrDistribution(
        payload.season,
        payload.gameMode,
        payload.gateWay
      );

      commit.SET_MMR_DISTRIBUTION(stats);
    },
  },
  mutations: {
    SET_LOADING_GAMES_PER_DAY(state: OverallStatisticState, loading: boolean) {
      state.loadingGamesPerDayStats = loading;
    },
    SET_GAMES_PER_DAY(state: OverallStatisticState, games: GameDayPerMode[][]) {
      state.gamesPerDay = games;
    },
    SET_MAPS_PER_SEASON(state: OverallStatisticState, games: MatchesOnMapPerSeason[]) {
      state.matchesOnMapPerSeason = games;
    },
    SET_LOADING_PLAYERS_PER_DAY(state: OverallStatisticState, loading: boolean) {
      state.loadingPlayersPerDayStats = loading;
    },
    SET_PLAYERS_PER_DAY(state: OverallStatisticState, games: GameDay[]) {
      state.playersPerDay = games;
    },
    SET_LOADING_MAP_AND_RACE_STATS(state: OverallStatisticState, loading: boolean) {
      state.loadingMapAndRaceStats = loading;
    },
    SET_MAP_AND_RACE_STATS(state: OverallStatisticState, stats: StatsPerWinrate[]) {
      state.statsPerMapAndRace = stats;
    },
    SET_GAME_LENGTH_STATS(state: OverallStatisticState, stats: GameLength[]) {
      state.gameLengths = stats;
    },
    SET_POPULAR_GAME_HOURS(state: OverallStatisticState, stats: PopularGameHour[]) {
      state.popularGameHours = stats;
    },
    SET_PLAYED_HEROES(state: OverallStatisticState, playedHeroes: PlayedHeroByMode[]) {
      state.playedHeroes = playedHeroes;
    },
    SET_HERO_WINRATES(state: OverallStatisticState, winLoss: WinLoss) {
      state.heroWinrate = winLoss;
    },
    SET_MMR_DISTRIBUTION(state: OverallStatisticState, mmrDistribution: MmrDistribution) {
      state.mmrDistribution = mmrDistribution;
    },
    SET_HIRO_PICK(state: OverallStatisticState, pick: { index: number; heroPick: HeroPick }) {
      const newPicks = [...state.heroPicks];
      newPicks[pick.index] = pick.heroPick;
      state.heroPicks = newPicks;
    },
  },
} as const;

export default mod;
