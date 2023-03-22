import { EGameMode, PlayerScore } from "@/store/typings";
import { moduleActionContext } from "..";
import { MatchState, MatchStatus, Mmr } from "./types";
import { Match, MatchDetail, RootState } from "../typings";
import { ActionContext } from "vuex";
import MatchService from "@/services/MatchService";

const mod = {
  namespaced: true,
  state: {
    page: 0,
    totalMatches: 0,
    loadingMatchDetail: true,
    matches: [] as Match[],
    allOngoingMatches: [] as Match[],
    matchDetail: {} as MatchDetail,
    status: MatchStatus.onGoing,
    gameMode: EGameMode.GM_1ON1,
    map: "Overall",
    mmr: { min: 0, max: 3000 } as Mmr,
    sort: "startTimeDescending",
  } as MatchState,
  actions: {
    async loadMatches(
      context: ActionContext<MatchState, RootState>,
      page?: number
    ) {
      const { commit, state, rootState } = moduleActionContext(context, mod);

      if (page != null && !isNaN(page)) {
        commit.SET_PAGE(page - 1);
      }

      let response: { count: number; matches: Match[] };

      if (state.status == MatchStatus.onGoing) {
        response = await MatchService.retrieveOnGoingMatchesPaged(
          state.page,
          rootState.gateway,
          state.gameMode,
          state.map,
          state.mmr,
          state.sort
        );
      } else {
        response = await MatchService.retrieveMatches(
          state.page,
          rootState.gateway,
          state.gameMode,
          state.map,
          state.mmr
        );
      }

      commit.SET_TOTAL_MATCHES(response.count);
      commit.SET_MATCHES(response.matches);
    },
    async loadAllOngoingMatches(
      context: ActionContext<MatchState, RootState>,
      gameMode?: EGameMode,
      map?: string
    ) {
      const { commit, state, rootState } = moduleActionContext(context, mod);

      const response = await MatchService.retrieveOnGoingMatches(
        0,
        200,
        rootState.gateway,
        gameMode || state.gameMode,
        map || state.map,
        state.mmr,
        state.sort
      );

      commit.SET_ALL_ONGOING_MATCHES(response.matches);
    },
    async loadMatchDetail(
      context: ActionContext<MatchState, RootState>,
      id: string
    ) {
      const { commit } = moduleActionContext(context, mod);

      commit.SET_LOADING_MATCH_DETAIL(true);
      const response = await MatchService.retrieveMatchDetail(id);

      commit.SET_MATCH_DETAIL(response);
      commit.SET_LOADING_MATCH_DETAIL(false);
    },
    async setStatus(
      context: ActionContext<MatchState, RootState>,
      matchStatus: MatchStatus
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_STATUS(matchStatus);
      commit.SET_PAGE(0);
      await dispatch.loadMatches(undefined);
    },
    async setGameMode(
      context: ActionContext<MatchState, RootState>,
      gameMode: EGameMode
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_GAME_MODE(gameMode);
      commit.SET_MAP("Overall");
      commit.SET_PAGE(0);
      await dispatch.loadMatches(undefined);
    },
    async setMap(context: ActionContext<MatchState, RootState>, map: string) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_MAP(map);
      commit.SET_PAGE(0);
      await dispatch.loadMatches(undefined);
    },
    async setMmr(
      context: ActionContext<MatchState, RootState>,
      mmr: Mmr
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_MMR(mmr);
      commit.SET_PAGE(0);
      await dispatch.loadMatches(undefined);
    },
    async setSort(
      context: ActionContext<MatchState, RootState>,
      sort: string
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_SORT(sort);
      commit.SET_PAGE(0);
      await dispatch.loadMatches(undefined);
    },
    async setPlayerScores(context: ActionContext<MatchState, RootState>, playerScores: PlayerScore[]) {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_PLAYER_SCORES(playerScores);
    },
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
    },
    SET_ALL_ONGOING_MATCHES(state: MatchState, matches: Match[]) {
      state.allOngoingMatches = matches;
    },
    SET_MATCH_DETAIL(state: MatchState, matchDetail: MatchDetail) {
      state.matchDetail = matchDetail;
    },
    SET_LOADING_MATCH_DETAIL(state: MatchState, loading: boolean) {
      state.loadingMatchDetail = loading;
    },
    SET_STATUS(state: MatchState, status: MatchStatus) {
      state.status = status;
    },
    SET_GAME_MODE(state: MatchState, gameMode: EGameMode) {
      state.gameMode = gameMode;
    },
    SET_MAP(state: MatchState, map: string) {
      state.map = map;
    },
    SET_MMR(state: MatchState, mmr: Mmr) {
      state.mmr = mmr;
    },
    SET_SORT(state: MatchState, sort: string) {
      state.sort = sort;
    },
    SET_PLAYER_SCORES(state: MatchState, playerScores: PlayerScore[]) {
      state.matchDetail.playerScores = playerScores;
    },
  },
} as const;

export default mod;
