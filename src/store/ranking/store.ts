import { CountryRanking, Ladder, Ranking, RankingState, Season } from "./types";
import { DataTableOptions, EGameMode } from "../typings";
import { defineStore } from "pinia";
import isEmpty from "lodash/isEmpty";
import RankingService from "@/services/RankingService";
import { useRootStore } from "@/store";
import { usePlayerStore } from "@/store/player/store";

export const useRankingStore = defineStore("ranking", {
  state: (): RankingState => ({
    league: 0,
    page: 0,
    totalRanks: 0,
    working: false,
    ladders: [],
    rankings: [],
    topFive: [],
    searchRanks: [],
    countryRankings: [],
    countryRankingsLoading: false,
    gameMode: EGameMode.GM_1ON1,
    seasons: [] as Season[],
    selectedSeason: {} as Season,
    selectedCountry: "",
  }),
  actions: {
    async retrieveRankings(options?: DataTableOptions) {
      if (options && options.page != null) {
        this.SET_PAGE(options.page - 1);
      }
      const player = usePlayerStore();
      const rootstate = useRootStore();
      const response = await RankingService.retrieveRankings(
        this.league,
        rootstate.gateway,
        this.gameMode,
        this.selectedSeason.id ?? player.selectedSeason.id,
      );
      this.SET_TOTAL_RANKS(response.length);
      this.SET_RANKINGS(response);
    },
    async getTopFive() {
      const rootstate = useRootStore();
      const rankings = await RankingService.retrieveRankings(
        0,
        rootstate.gateway,
        EGameMode.GM_1ON1,
        this.selectedSeason.id,
      );
      this.SET_TOP_FIVE(rankings.slice(0, 5));
    },
    async getCountryRankings() {
      this.SET_COUNTRY_RANKINGS_LOADING(true);
      const rootstate = useRootStore();
      const rankings = await RankingService.retrieveCountryRankings(
        this.selectedCountry,
        rootstate.gateway,
        this.gameMode,
        this.selectedSeason.id,
      );
      this.SET_COUNTRY_RANKINGS(rankings);
      this.SET_COUNTRY_RANKINGS_LOADING(false);
    },
    async search(search: { searchText: string; gameMode: EGameMode }) {
      const rootstate = useRootStore();
      const rankings = await RankingService.searchRankings(
        search.searchText,
        rootstate.gateway,
        search.gameMode,
        this.selectedSeason.id,
      );
      this.SET_SEARCH_RANKINGS(rankings);
    },
    async clearSearch() {
      this.SET_SEARCH_RANKINGS([]);
    },
    setLeague(league: number) {
      this.SET_LEAGUE(league);
    },
    setSeason(season: Season) {
      this.SET_SELECTED_SEASON(season);
    },
    async setCountry(country: string) {
      this.SET_COUNTRY(country);
      await this.getCountryRankings();
    },
    async setGameMode(gameMode: EGameMode) {
      this.SET_GAME_MODE(gameMode);
      await this.retrieveRankings(undefined);
    },
    async retrieveLeagueConstellation() {
      const ladders = await RankingService.retrieveLadders(
        this.selectedSeason.id,
      );
      this.SET_LEAGUE_CONSTELLATION(ladders);
    },
    async retrieveSeasons() {
      // Seasons already fetched, skip
      if (!isEmpty(this.seasons)) {
        return;
      }
      const seasons = await RankingService.retrieveSeasons();
      this.SET_SEASONS(seasons);
    },
    SET_RANKINGS(rankings: Ranking[]): void {
      this.rankings = rankings;
    },
    SET_PAGE(page: number): void {
      this.page = page;
    },
    SET_TOTAL_RANKS(totalRanks: number): void {
      this.totalRanks = totalRanks;
    },
    SET_TOP_FIVE(rankings: Ranking[]): void {
      this.topFive = rankings;
    },
    SET_SEARCH_RANKINGS(rankings: Ranking[]): void {
      this.searchRanks = rankings;
    },
    SET_COUNTRY_RANKINGS(rankings: CountryRanking[]): void {
      this.countryRankings = rankings;
    },
    SET_COUNTRY_RANKINGS_LOADING(isLoading: boolean): void {
      this.countryRankingsLoading = isLoading;
    },
    SET_LEAGUE(league: number): void {
      this.league = league;
    },
    SET_LEAGUE_CONSTELLATION(ladders: Ladder[]): void {
      this.ladders = ladders;
    },
    SET_GAME_MODE(gameMode: EGameMode): void {
      this.gameMode = gameMode;
    },
    SET_SEASONS(seasons: Season[]): void {
      this.seasons = seasons;
    },
    SET_SELECTED_SEASON(season: Season): void {
      this.selectedSeason = season;
    },
    SET_COUNTRY(country: string): void {
      this.selectedCountry = country;
    },
  },
});
