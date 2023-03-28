import { RootState } from "@/store/rootState/types";
import { Gateways } from "@/store/ranking/types";
import GatewaysService from "@/services/GatewaysService";
import LocaleService from "@/services/LocaleService";
import { defineStore } from "pinia";

export const useRootStateStore = defineStore("rootState", {
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
