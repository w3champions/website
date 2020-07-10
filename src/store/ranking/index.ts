import { moduleActionContext } from "..";
import { Ladder, Ranking, RankingState, Season } from "./types";
import { DataTableOptions, EGameMode, RootState } from "../typings";
import { ActionContext } from "vuex";
import GatewaysService from "@/services/GatewaysService";

const mod = {
  namespaced: true,
  state: {
    league: 0,
    page: 0,
    totalRanks: 0,
    working: false,
    ladders: [],
    rankings: [],
    topFive: [],
    searchRanks: [],
    gameMode: EGameMode.GM_1ON1,
    seasons: [] as Season[],
    selectedSeason: {} as Season,
  } as RankingState,
  actions: {
    async retrieveRankings(
      context: ActionContext<RankingState, RootState>,
      options?: DataTableOptions
    ) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      if (options && options.page != null) {
        commit.SET_PAGE(options.page - 1);
      }

      const response = await rootGetters.rankingService.retrieveRankings(
        state.league,
        rootState.gateway,
        state.gameMode,
        state.selectedSeason.id ?? rootState.player.selectedSeason.id
      );

      commit.SET_TOTAL_RANKS(response.length);
      commit.SET_RANKINGS(response);
    },
    async getTopFive(context: ActionContext<RankingState, RootState>) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      const rankings = await rootGetters.rankingService.retrieveRankings(
        0,
        rootState.gateway,
        EGameMode.GM_1ON1,
        state.selectedSeason.id
      );
      commit.SET_TOP_FIVE(rankings.slice(0, 5));
    },
    async search(
      context: ActionContext<RankingState, RootState>,
      search: { searchText: string; gameMode: EGameMode }
    ) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      const rankings = await rootGetters.rankingService.searchRankings(
        search.searchText,
        rootState.gateway,
        search.gameMode,
        state.selectedSeason.id
      );

      commit.SET_SEARCH_RANKINGS(rankings);
    },
    async clearSearch(context: ActionContext<RankingState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_SEARCH_RANKINGS([]);
    },
    async setLeague(
      context: ActionContext<RankingState, RootState>,
      league: number
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_LEAGUE(league);
      await dispatch.retrieveRankings(undefined);
    },
    async setSeason(
      context: ActionContext<RankingState, RootState>,
      season: Season
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_SELECTED_SEASON(season);

      await dispatch.retrieveLeagueConstellation();
      await dispatch.retrieveRankings(undefined);
    },
    async setGameMode(
      context: ActionContext<RankingState, RootState>,
      gameMode: EGameMode
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_GAME_MODE(gameMode);
      await dispatch.retrieveRankings(undefined);
    },
    async retrieveLeagueConstellation(
      context: ActionContext<RankingState, RootState>
    ) {
      const { commit, rootGetters, state } = moduleActionContext(context, mod);

      const ladders = await rootGetters.rankingService.retrieveLadders(
        state.selectedSeason.id
      );

      commit.SET_LEAGUE_CONSTELLATION(ladders);
    },
    async retrieveSeasons(context: ActionContext<RankingState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const seasons = await rootGetters.rankingService.retrieveSeasons();

      commit.SET_SEASONS(seasons);
    },
  },
  mutations: {
    SET_RANKINGS(state: RankingState, rankings: Ranking[]) {
      state.rankings = rankings;
    },
    SET_PAGE(state: RankingState, page: number) {
      state.page = page;
    },
    SET_TOTAL_RANKS(state: RankingState, totalRanks: number) {
      state.totalRanks = totalRanks;
    },
    SET_TOP_FIVE(state: RankingState, rankings: Ranking[]) {
      state.topFive = rankings;
    },
    SET_SEARCH_RANKINGS(state: RankingState, rankings: Ranking[]) {
      state.searchRanks = rankings;
    },
    SET_LEAGUE(state: RankingState, league: number) {
      state.league = league;
    },
    SET_LEAGUE_CONSTELLATION(state: RankingState, ladders: Ladder[]) {
      state.ladders = ladders;
    },
    SET_GAME_MODE(state: RankingState, gameMode: EGameMode) {
      state.gameMode = gameMode;
    },
    SET_SEASONS(state: RankingState, seasons: Season[]) {
      state.seasons = seasons;
    },
    SET_SELECTED_SEASON(state: RankingState, season: Season) {
      state.selectedSeason = season;
    },
  },
} as const;

export default mod;
