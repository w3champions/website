import { EGameMode, PlayerScore } from "@/store/types";
import { MatchState, MatchStatus, Mmr } from "./types";
import { Match, MatchDetail } from "../types";
import MatchService from "@/services/MatchService";
import { defineStore } from "pinia";
import { useRootStateStore } from "@/store/rootState/store";
import { Season } from "@/store/ranking/types";

export const useMatchStore = defineStore("match", {
  state: (): MatchState => ({
    page: 1,
    totalMatches: 0,
    loadingMatchDetail: true,
    matches: [] as Match[],
    allOngoingMatches: [] as Match[],
    matchDetail: {} as MatchDetail,
    mapNames: [],
    status: MatchStatus.onGoing,
    gameMode: EGameMode.GM_1ON1,
    map: "Overall",
    mmr: { min: 0, max: 3000 } as Mmr,
    duration: { min: 0, max: 14400 } as { min: number; max: number },
    sort: "startTimeDescending",
    selectedSeason: {} as Season,
    showHeroIcons: false,
    selectedHeroFilter: [],
  }),
  actions: {
    async loadMatches() {
      let response: { count: number; matches: Match[] };
      const rootStateStore = useRootStateStore();
      if (this.status == MatchStatus.onGoing) {
        response = await MatchService.retrieveOnGoingMatchesPaged(
          this.page - 1,
          rootStateStore.gateway,
          this.gameMode,
          this.map,
          this.mmr,
          this.duration,
          this.sort,
        );

        // Handle edge case when loading ongoing matches, if the number of matches are reduced
        // so that the current page no longer exists, we decrement the current page by 1 and retry.
        if (!response.matches.length && this.page > 1) {
          this.SET_PAGE(this.page - 1);
          await this.loadMatches();
          return;
        }
      } else {
        // If the selected map isn't available in this season, reset the map filter
        const map = this.mapNames.includes(this.map) ? this.map : "Overall";

        if (map !== this.map) {
          this.SET_MAP(map);
        }

        response = await MatchService.retrieveMatches(
          this.page - 1,
          rootStateStore.gateway,
          this.gameMode,
          this.map,
          this.mmr,
          this.duration,
          this.selectedSeason.id,
          this.selectedHeroFilter,
        );
      }
      this.SET_TOTAL_MATCHES(response.count);
      this.SET_MATCHES(response.matches);
    },
    async loadAllOngoingMatches(gameMode?: EGameMode, map?: string) {
      const rootStateStore = useRootStateStore();
      const response = await MatchService.retrieveOnGoingMatches(
        0,
        200,
        rootStateStore.gateway,
        gameMode || this.gameMode,
        map || this.map,
        this.mmr,
        this.duration,
        this.sort,
      );
      this.SET_ALL_ONGOING_MATCHES(response.matches);
    },
    async loadMatchDetail(id: string) {
      this.SET_LOADING_MATCH_DETAIL(true);
      const response = await MatchService.retrieveMatchDetail(id);

      this.SET_MATCH_DETAIL(response);
      this.SET_LOADING_MATCH_DETAIL(false);
    },
    async loadMapNames() {
      if (this.status === MatchStatus.onGoing) {
        this.SET_MAP_NAMES([]);
        return;
      }

      const mapNames = await MatchService.retrieveMapNames(this.selectedSeason.id, this.gameMode);
      this.SET_MAP_NAMES(mapNames);
    },
    async setStatus(matchStatus: MatchStatus) {
      this.SET_STATUS(matchStatus);
      this.SET_MAP("Overall");
      this.SET_PAGE(1);
      await this.loadMapNames();
      await this.loadMatches();
    },
    async setGameMode(gameMode: EGameMode) {
      this.SET_GAME_MODE(gameMode);
      this.SET_MAP("Overall");
      this.SET_PAGE(1);
      await this.loadMapNames();
      await this.loadMatches();
    },
    async setMap(map: string) {
      this.SET_MAP(map);
      this.SET_PAGE(1);
      await this.loadMatches();
    },
    async setMmr(mmr: Mmr) {
      this.SET_MMR(mmr);
      this.SET_PAGE(1);
      await this.loadMatches();
    },
    async setDuration(duration: { min: number; max: number }) {
      this.SET_DURATION(duration);
      this.SET_PAGE(1);
      await this.loadMatches();
    },
    async setSort(sort: string) {
      this.SET_SORT(sort);
      this.SET_PAGE(1);
      await this.loadMatches();
    },
    async setSeason(season: Season) {
      this.SET_SEASON(season);
      this.SET_PAGE(1);
      await this.loadMapNames();
      await this.loadMatches();
    },
    async setPlayerScores(playerScores: PlayerScore[]) {
      this.SET_PLAYER_SCORES(playerScores);
    },
    async setShowHeroIcons(showHeroIcons: boolean) {
      this.SET_SHOW_HERO_ICONS(showHeroIcons);
    },

    async setSelectedHeroFilter(heroes: number[]) {
      this.SET_SELECTED_HERO_FILTER(heroes);
      this.SET_PAGE(1);
      await this.loadMatches();
    },

    SET_PAGE(page: number): void {
      this.page = page;
    },
    SET_TOTAL_MATCHES(totalMatches: number): void {
      this.totalMatches = totalMatches;
    },
    SET_MATCHES(matches: Match[]): void {
      this.matches = matches;
    },
    SET_ALL_ONGOING_MATCHES(matches: Match[]): void {
      this.allOngoingMatches = matches;
    },
    SET_MATCH_DETAIL(matchDetail: MatchDetail): void {
      this.matchDetail = matchDetail;
    },
    SET_MAP_NAMES(mapNames: string[]): void {
      this.mapNames = mapNames;
    },
    SET_LOADING_MATCH_DETAIL(loading: boolean): void {
      this.loadingMatchDetail = loading;
    },
    SET_STATUS(status: MatchStatus): void {
      this.status = status;
    },
    SET_GAME_MODE(gameMode: EGameMode): void {
      this.gameMode = gameMode;
    },
    SET_MAP(map: string): void {
      this.map = map;
    },
    SET_MMR(mmr: Mmr): void {
      this.mmr = mmr;
    },
    SET_DURATION(duration: { min: number; max: number }): void {
      this.duration = duration;
    },
    SET_SORT(sort: string): void {
      this.sort = sort;
    },
    SET_PLAYER_SCORES(playerScores: PlayerScore[]): void {
      this.matchDetail.playerScores = playerScores;
    },
    SET_SEASON(season: Season): void {
      this.selectedSeason = season;
    },
    SET_SHOW_HERO_ICONS(showHeroIcons: boolean): void {
      this.showHeroIcons = showHeroIcons;
    },
    SET_SELECTED_HERO_FILTER(heroes: number[]): void {
      this.selectedHeroFilter = heroes;
    },
  },
});
