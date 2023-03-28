import Vue from "vue";
import Vuex, { ActionContext } from "vuex";
import { createDirectStore } from "direct-vuex";

import matches from "./match/index";
import personalSettings from "./personalSettings/index";

import { RootState } from "./typings";
import { Gateways } from "./ranking/types";
import GatewaysService from "@/services/GatewaysService";
import LocaleService from "@/services/LocaleService";
import { OauthState } from "@/store/oauth/types";
import { defineStore } from "pinia";

Vue.use(Vuex);

export const useRootStore = defineStore("root", {
  state: (): RootState => ({
    darkMode: false,
    gateway: GatewaysService.getGateway(),
    locale: "en",
  }),
  actions: {
    loadLocale() {
      const locale = LocaleService.getLocale();
      this.SET_LOCALE(locale);
    },
    saveLocale(locale: string) {
      LocaleService.setLocale(locale);
      this.SET_LOCALE(locale);
    },
    setGateway(gateway: Gateways) {
      this.SET_GATEWAY(gateway);
    },
    SET_DARK_MODE(darkMode: boolean): void {
      this.darkMode = darkMode;
    },
    SET_GATEWAY(gateway: Gateways): void {
      this.gateway = gateway;
      GatewaysService.setGateway(gateway);
    },
    SET_LOCALE(locale: string): void {
      this.locale = locale;
    },
  },
});

const mod = {
  modules: {
    matches,
    personalSettings,
  },
  state: {
    darkMode: false,
    gateway: GatewaysService.getGateway(),
    locale: "en",
  } as RootState,
  actions: {
    loadLocale(context: ActionContext<OauthState, RootState>) {
      const { commit } = moduleActionContext(context, mod);

      const locale = LocaleService.getLocale();
      commit.SET_LOCALE(locale);
    },
    saveLocale(context: ActionContext<OauthState, RootState>, locale: string) {
      const { commit } = moduleActionContext(context, mod);

      LocaleService.setLocale(locale);
      commit.SET_LOCALE(locale);
    },
    setGateway(context: ActionContext<OauthState, RootState>, gateway: Gateways) {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_GATEWAY(gateway);
    },
  },
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
    },
  },
} as const;

const { store, rootActionContext, moduleActionContext } = createDirectStore(mod);

export default store;

export { rootActionContext, moduleActionContext };

export type AppStore = typeof store;

declare module "vuex" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Store<S> {
    direct: AppStore;
  }
}
