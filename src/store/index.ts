import Vue from "vue";
import Vuex from "vuex";
import { createDirectStore } from "direct-vuex";

import RankingService from "@/services/RankingService";
import MatchService from '@/services/MatchService';

import rankings from "./ranking/index";
import player from "./player/index";
import match from "./match/index";

Vue.use(Vuex);

const services = {
  rankingService: new RankingService(15),
  matchService: new MatchService(100),
};

const mod = {
  modules: {
    player,
    rankings,
    match,
  },
  state: {},
  actions: {},
  mutations: {},
  getters: {
    rankingService() {
      return services.rankingService;
    },
    matchService() {
      return services.matchService;
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
