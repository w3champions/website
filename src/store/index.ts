import Vue from "vue";
import Vuex from "vuex";
import { createDirectStore } from "direct-vuex";

import tournaments from "./tournaments/index";
import player from "./player/index";
import matches from "./match/index";
import overallStatistics from "./overallStats/index";
import oauth from "./oauth/index";
import personalSettings from "./personalSettings/index";
import clan from "./clan/index";
import twitch from "./twitch/index";
import admin from "./admin/index";
import rankings from "./ranking/index";

import RankingService from "@/services/RankingService";
import MatchService from "@/services/MatchService";
import ProfileService from "@/services/ProfileService";
import { RootState } from "./typings";
import StatisticService from "@/services/StatisticService";
import AuthorizationService from "@/services/AuthorizationService";
import PersonalSettingsService from "@/services/PersonalSettingsService";
import { Gateways } from "./ranking/types";
import GatewaysService from "@/services/GatewaysService";
import ClanService from "@/services/ClanService";
import TwitchService from "@/services/TwitchService";
import AdminService from "@/services/AdminService";
import TournamentsService from "@/services/TournamentsService";
import LocaleService from "@/services/LocaleService";


Vue.use(Vuex);

const services = {
  rankingService: new RankingService(),
  matchService: new MatchService(50),
  profileService: new ProfileService(),
  statisticService: new StatisticService(),
  oauthService: new AuthorizationService(),
  personalSettingsService: new PersonalSettingsService(),
  clanService: new ClanService(),
  twitchService: new TwitchService(),
  adminService: new AdminService(),
  tournamentsService: new TournamentsService(),
  localeService: new LocaleService()
};

const mod = {
  modules: {
    player,
    rankings,
    matches,
    overallStatistics,
    oauth,
    personalSettings,
    clan,
    twitch,
    admin,
    tournaments
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
    SET_LOCALE(state: RootState, locale: string) {
      state.locale = locale;
      console.log(locale)
      LocaleService.setLocale(locale)
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
    },
    oauthService() {
      return services.oauthService;
    },
    personalSettingsService() {
      return services.personalSettingsService;
    },
    clanService() {
      return services.clanService;
    },
    twitchService() {
      return services.twitchService;
    },
    adminService() {
      return services.adminService;
    },
    tournamentsService() {
      return services.tournamentsService;
    },
    localeService() {
      return services.localeService;
    }
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
