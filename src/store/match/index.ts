import { moduleActionContext } from "..";
import { MatchState } from "./types";
import { Match, MatchDetail, RootState } from "../typings";
import { ActionContext } from "vuex";
import { Gateways } from "../ranking/types";

const mod = {
  namespaced: true,
  state: {
    page: 0,
    totalMatches: 0,
    loadingMatchDetail: true,
    matches: [] as Match[],
    matchDetail: {} as MatchDetail,
    gateWay: 20 as Gateways,
  } as MatchState,
  actions: {
    async loadMatches(
      context: ActionContext<MatchState, RootState>,
      page?: number
    ) {
      const { commit, rootGetters, state } = moduleActionContext(context, mod);

      if (page != null && !isNaN(page)) {
        commit.SET_PAGE(page - 1);
      }

      const response = await rootGetters.matchService.retrieveMatches(
        state.page,
        state.gateWay
      );

      commit.SET_TOTAL_MATCHES(response.count);
      commit.SET_MATCHES(response.matches);
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
    async setGateway(
      context: ActionContext<MatchState, RootState>,
      gateway: Gateways
    ) {
      const { commit, dispatch } = moduleActionContext(context, mod);
      commit.SET_GATEWAY(gateway);
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
    SET_MATCH_DETAIL(state: MatchState, matchDetail: MatchDetail) {
      state.matchDetail = matchDetail;
    },
    SET_LOADING_MATCH_DETAIL(state: MatchState, loading: boolean) {
      state.loadingMatchDetail = loading;
    },
    SET_GATEWAY(state: MatchState, gateway: Gateways) {
      state.gateWay = gateway;
    },
  },
} as const;

export default mod;
