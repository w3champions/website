import { EGameMode } from "@/store/typings";
import { moduleActionContext } from "..";
import { MatchState, MatchStatus } from "./types";
import { Match, MatchDetail, RootState } from "../typings";
import { ActionContext } from "vuex";

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
  } as MatchState,
  actions: {
    async loadMatches(
      context: ActionContext<MatchState, RootState>,
      page?: number
    ) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      if (page != null && !isNaN(page)) {
        commit.SET_PAGE(page - 1);
      }

      let response: { count: number; matches: Match[] };

      if (state.status == MatchStatus.onGoing) {
        response = await rootGetters.matchService.retrieveOnGoingMatchesPaged(
          state.page,
          rootState.gateway,
          state.gameMode
        );
      } else {
        response = await rootGetters.matchService.retrieveMatches(
          state.page,
          rootState.gateway,
          state.gameMode
        );
      }

      commit.SET_TOTAL_MATCHES(response.count);
      commit.SET_MATCHES(response.matches);
    },
    async loadAllOngoingMatches(context: ActionContext<MatchState, RootState>, gameMode?: EGameMode) {
      const { commit, rootGetters, state, rootState } = moduleActionContext(
        context,
        mod
      );

      const response = await rootGetters.matchService.retrieveOnGoingMatches(
        0,
        200,
        rootState.gateway,
        gameMode || state.gameMode
      );

      commit.SET_ALL_ONGOING_MATCHES(response.matches);
    },
    async loadMatchDetail(
      context: ActionContext<MatchState, RootState>,
      id: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      commit.SET_LOADING_MATCH_DETAIL(true);
      const response = await rootGetters.matchService.retrieveMatchDetail(id);

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
      commit.SET_PAGE(0);
      await dispatch.loadMatches(undefined);
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
  },
} as const;

export default mod;
