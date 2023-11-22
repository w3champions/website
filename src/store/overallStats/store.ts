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
  SeasonGameModeGateWayForMMR,
  StatsPerWinrate,
  WinLoss,
  PopularHours,
  MatchupLength,
  MmrRangeValues,
} from "./types";
import { ERaceEnum } from "../types";
import StatisticService from "@/services/StatisticService";
import { defineStore } from "pinia";

export const useOverallStatsStore = defineStore("overallStats", {
  state: (): OverallStatisticState => ({
    loadingGamesPerDayStats: true,
    loadingMapAndRaceStats: true,
    loadingPlayersPerDayStats: true,
    gamesPerDay: [[]] as GameDayPerMode[][],
    playersPerDay: [] as GameDay[],
    statsPerMapAndRace: [] as StatsPerWinrate[],
    gameLengths: [] as GameLength[],
    matchupLength: {} as MatchupLength,
    playedHeroes: [] as PlayedHeroByMode[],
    matchesOnMapPerSeason: [] as MatchesOnMapPerSeason[],
    heroWinrate: {} as WinLoss,
    mmrDistribution: {} as MmrDistribution,
    popularHours: [] as PopularHours[],
    matchupMmrRange: "all" as MmrRangeValues,
    heroPicks: [
      { name: "anyhero", heroId: "all", race: ERaceEnum.TOTAL },
      { name: "anyhero", heroId: "all", race: ERaceEnum.TOTAL },
      { name: "anyhero", heroId: "all", race: ERaceEnum.TOTAL },
      { name: "anyhero", heroId: "all", race: ERaceEnum.TOTAL },
      { name: "anyhero", heroId: "all", race: ERaceEnum.TOTAL },
      { name: "anyhero", heroId: "all", race: ERaceEnum.TOTAL },
    ] as HeroPick[],
  }),
  actions: {
    async loadGamesPerDayStatistics() {
      this.SET_LOADING_GAMES_PER_DAY(true);
      const games = await StatisticService.retrieveGamesPerDay();
      this.SET_GAMES_PER_DAY(games);
      this.SET_LOADING_GAMES_PER_DAY(false);
    },
    async loadMapsPerSeason() {
      const games = await StatisticService.retrieveMapsPerSeason();
      this.SET_MAPS_PER_SEASON(games);
    },
    async loadPlayersPerDayStatistics() {
      this.SET_LOADING_PLAYERS_PER_DAY(true);
      const games = await StatisticService.retrievePlayersPerDay();
      const mapToGameDay = (r: PlayersPerDay): GameDay => {
        return { date: r.date, gamesPlayed: r.distinctPlayers } as GameDay;
      };
      const playersPerDay = games.map((r) => mapToGameDay(r));
      this.SET_PLAYERS_PER_DAY(playersPerDay);
      this.SET_LOADING_PLAYERS_PER_DAY(false);
    },
    async loadMapAndRaceStatistics() {
      this.SET_LOADING_MAP_AND_RACE_STATS(true);
      const stats = await StatisticService.retrieveMapAndRaceStats();
      this.SET_MAP_AND_RACE_STATS(stats);
      this.SET_LOADING_MAP_AND_RACE_STATS(false);
    },
    async loadGameLengthStatistics() {
      const stats = await StatisticService.retrieveGameLengths();
      this.SET_GAME_LENGTH_STATS(stats);
    },
    async loadMatchupLengthStatistics(race1 = 1, race2 = 1, season = "all") {
       const stats = await StatisticService.retrieveMatchupLengths(race1, race2, season);
      this.SET_MATCHUP_LENGTH_STATS(stats);
    },
    async loadPlayedHeroes() {
      const stats = await StatisticService.retrievePlayedHeroes();
      this.SET_PLAYED_HEROES(stats);
    },
    async loadPopularGameHours() {
      const stats = await StatisticService.retrievePopularGameHours();
      this.SET_POPULAR_GAME_HOURS(stats);
    },
    async loadHeroWinrates() {
      const stats = await StatisticService.retrieveHeroWinrates(
        this.heroPicks[0].heroId,
        this.heroPicks[1].heroId,
        this.heroPicks[2].heroId,
        this.heroPicks[3].heroId,
        this.heroPicks[4].heroId,
        this.heroPicks[5].heroId,
      );
      this.SET_HERO_WINRATES(stats);
    },
    async loadMmrDistribution(payload: SeasonGameModeGateWayForMMR) {
      const stats = await StatisticService.retrieveMmrDistribution(
        payload.season,
        payload.gameMode,
        payload.gateWay,
      );
      this.SET_MMR_DISTRIBUTION(stats);
    },
    SET_LOADING_GAMES_PER_DAY(loading: boolean): void {
      this.loadingGamesPerDayStats = loading;
    },
    SET_GAMES_PER_DAY(games: GameDayPerMode[][]): void {
      this.gamesPerDay = games;
    },
    SET_MAPS_PER_SEASON(games: MatchesOnMapPerSeason[]): void {
      this.matchesOnMapPerSeason = games;
    },
    SET_LOADING_PLAYERS_PER_DAY(loading: boolean): void {
      this.loadingPlayersPerDayStats = loading;
    },
    SET_PLAYERS_PER_DAY(games: GameDay[]): void {
      this.playersPerDay = games;
    },
    SET_LOADING_MAP_AND_RACE_STATS(loading: boolean): void {
      this.loadingMapAndRaceStats = loading;
    },
    SET_MAP_AND_RACE_STATS(stats: StatsPerWinrate[]): void {
      this.statsPerMapAndRace = stats;
    },
    SET_GAME_LENGTH_STATS(stats: GameLength[]): void {
      this.gameLengths = stats;
    },
    SET_MATCHUP_LENGTH_STATS(stats: MatchupLength): void {
      this.matchupLength = stats;
    },
    SET_POPULAR_GAME_HOURS(stats: PopularHours[]): void {
      this.popularHours = stats;
    },
    SET_PLAYED_HEROES(playedHeroes: PlayedHeroByMode[]): void {
      this.playedHeroes = playedHeroes;
    },
    SET_HERO_WINRATES(winLoss: WinLoss): void {
      this.heroWinrate = winLoss;
    },
    SET_MMR_DISTRIBUTION(mmrDistribution: MmrDistribution): void {
      this.mmrDistribution = mmrDistribution;
    },
    SET_HERO_PICK(pick: { index: number; heroPick: HeroPick }): void {
      const newPicks = [...this.heroPicks];
      newPicks[pick.index] = pick.heroPick;
      this.heroPicks = newPicks;
    },
    SET_MATCHUP_MMR_RANGE(mmrRange: MmrRangeValues) {
      this.matchupMmrRange = mmrRange;
    }
  },
});
