import Vue from "vue";
import Vuex from "vuex";
import { createDirectStore } from "direct-vuex";

import rankings from "./ranking/index";
import player from "./player/index";
import matches from "./match/index";
import overallStatistics from "./overallStats/index";
import oauth from "./oauth/index";
import personalSettings from "./personalSettings/index";
import chat from "./chat/index";
import clan from "./clan/index";

import RankingService from "@/services/RankingService";
import MatchService from "@/services/MatchService";
import ProfileService from "@/services/ProfileService";
import { RootState } from "./typings";
import StatisticService from "@/services/StatisticService";
import AuthorizationService from "@/services/AuthorizationService";
import PersonalSettingsService from "@/services/PersonalSettingsService";
import { Gateways } from "./ranking/types";
import GatewaysService from "@/services/GatewaysService";
import ChatService from "@/services/ChatService";
import ClanService from "@/services/ClanService";

Vue.use(Vuex);

const services = {
  rankingService: new RankingService(),
  matchService: new MatchService(50),
  profileService: new ProfileService(),
  statisticService: new StatisticService(),
  oauthService: new AuthorizationService(),
  personalSettingsService: new PersonalSettingsService(),
  chatService: new ChatService(),
  clanService: new ClanService(),
};

const mod = {
  modules: {
    player,
    rankings,
    matches,
    overallStatistics,
    oauth,
    personalSettings,
    chat,
    clan,
  },
  state: {
    darkMode: false,
    gateway: GatewaysService.getGateway(),
  } as RootState,
  actions: {},
  mutations: {
    SET_DARK_MODE(state: RootState, darkMode: boolean) {
      state.darkMode = darkMode;
    },
    SET_GATEWAY(state: RootState, gateway: Gateways) {
      state.gateway = gateway;
      GatewaysService.setGateway(gateway);
    },
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
    },
    oauthService() {
      return services.oauthService;
    },
    personalSettingsService() {
      return services.personalSettingsService;
    },
    chatService() {
      return services.chatService;
    },
    clanService() {
      return services.clanService;
    },
  },
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
