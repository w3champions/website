import Vue from "vue";
import Vuex from "vuex";
import { createDirectStore } from "direct-vuex";

import RankingService from "@/services/RankingService";
import MatchService from "@/services/MatchService";

import rankings from "./ranking/index";
import player from "./player/index";
import match from "./match/index";
import overallStatistics from "./overallStats/index";
import ProfileService from "@/services/ProfileService";
import { RootState } from "./typings";
import StatisticService from "@/services/StatisticService";

Vue.use(Vuex);

const services = {
  rankingService: new RankingService(),
  matchService: new MatchService(50),
  profileService: new ProfileService(),
  statisticService: new StatisticService(),
};

const mod = {
  modules: {
    player,
    rankings,
    match,
    overallStatistics
  },
  state: {
    darkMode: false
  } as RootState,
  actions: {},
  mutations: {
    SET_DARK_MODE(state: RootState, darkMode: boolean) {
      state.darkMode = darkMode;
    }
  },
  getters: {
    rankingService() {
      return services.rankingService;
    },
    matchService() {
      return services.matchService;
    },
    profileService() {
      return services.profileService;
    },
    statisticService() {
      return services.statisticService;
    }
  }
} as const;

const { store, rootActionContext, moduleActionContext } = createDirectStore(
  mod
);

export default store;

export { rootActionContext, moduleActionContext };

export type AppStore = typeof store;

declare module "vuex" {
  interface Store<S> {
    direct: AppStore;
  }
}
