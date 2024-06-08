import {
  AdminState,
  BannedPlayer,
  GloballyMutedPlayer,
  GlobalMute,
  OverridesList,
  Proxy,
  ProxySettings,
  QueueData,
} from "./types";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/admin/AdminService";
import { defineStore } from "pinia";
import { formatTimestampString } from "@/helpers/date-functions";

export const useAdminStore = defineStore("admin", {
  state: (): AdminState => ({
    total: 0,
    bannedPlayers: [],
    queuedata: [],
    availableProxies: [],
    proxiesSetForSearchedPlayer: {} as ProxySettings,
    searchedBattletag: "",
    modifiedProxies: {
      nodeOverrides: [],
      automaticNodeOverrides: [],
    } as ProxySettings,
    proxyModified: false,
    globallyMutedPlayers: [] as GloballyMutedPlayer[],
    banValidationError: "",
    showJwtExpiredDialog: false,
  }),
  actions: {
    async loadBannedPlayers() {
      const oauthStore = useOauthStore();
      const bannedPlayers = await AdminService.getBannedPlayers(oauthStore.token);

      bannedPlayers.players.forEach((bannedPlayer) => {
        bannedPlayer.endDate = formatTimestampString(bannedPlayer.endDate, "yyyy-MM-dd HH:mm:ss");
        bannedPlayer.banInsertDate = formatTimestampString(bannedPlayer.banInsertDate, "yyyy-MM-dd HH:mm:ss");
      });

      this.SET_BANNED_PLAYERS(bannedPlayers.players);
    },
    async postBan(bannedPlayer: BannedPlayer) {
      const oauthStore = useOauthStore();
      const response = await AdminService.postBan(bannedPlayer, oauthStore.token);
      this.SET_BAN_VALIDATION_ERROR(response);
    },
    resetBanValidationMessage() {
      this.SET_BAN_VALIDATION_ERROR("");
    },
    async deleteBan(bannedPlayer: BannedPlayer) {
      const oauthStore = useOauthStore();
      await AdminService.deleteBan(bannedPlayer, oauthStore.token);
    },
    async loadQueueData(token: string) {
      const queuedata = await AdminService.getQueueData(token);
      this.SET_QUEUEDATA(queuedata);
    },
    async loadAvailableProxies(token: string) {
      const availableProxies =
        await AdminService.getAvailableProxies(token);
      this.SET_AVAILABLEPROXIES(availableProxies);
    },
    async getProxiesForPlayer(battleTag: string): Promise<ProxySettings> {
      const oauthStore = useOauthStore();
      const proxiesSet = await AdminService.getProxiesForBattletag(battleTag, oauthStore.token);
      this.SET_SEARCHED_PROXIES_FOR_BATTLETAG(proxiesSet);
      this.SET_SEARCHED_PLAYER_BTAG(battleTag);

      return proxiesSet;
    },
    updateModifiedProxies(overrides: OverridesList): void {
      if (overrides.isAutomatic) {
        this.SET_MODIFIED_AUTO_PROXIES(overrides);
        return;
      }
      this.SET_MODIFIED_PROXIES(overrides);
    },
    async putNewProxies(proxies: ProxySettings): Promise<void> {
      if (this.proxiesSetForSearchedPlayer._id === undefined || null) {
        return;
      }
      const oauthStore = useOauthStore();
      const response = await AdminService.putProxies(
        proxies,
        this.proxiesSetForSearchedPlayer._id,
        oauthStore.token,
      );
      if (response.status == 200) {
        this.SET_SEARCHED_PROXIES_FOR_BATTLETAG(proxies);
      }
    },
    async getAltsForPlayer(btag: string): Promise<string[]> {
      const oauthStore = useOauthStore();
      return await AdminService.getAltsForBattletag(btag, oauthStore.token);
    },
    async loadGlobalMutes(): Promise<void> {
      const oauthStore = useOauthStore();
      const getGlobalMutes = await AdminService.getGlobalMutes(oauthStore.token);
      this.SET_MUTED_PLAYERS(getGlobalMutes);
    },
    async deleteGlobalMute(
      player: GloballyMutedPlayer,
    ): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.deleteGlobalMute(oauthStore.token, player.id);
    },
    async addGlobalMute(mute: GlobalMute): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.putGlobalMute(oauthStore.token, mute);
    },
    async checkJwtLifetime(): Promise<void> {
      const oauthStore = useOauthStore();
      if (!oauthStore.token) return;
      const isExpired = !(await AdminService.checkJwtLifetime(oauthStore.token));
      if (isExpired) {
        oauthStore.logout();
        this.SET_SHOW_JWT_EXPIRED_DIALOG(true);
      }
    },
    SET_BANNED_PLAYERS(bannedPlayers: BannedPlayer[]): void {
      this.bannedPlayers = bannedPlayers;
    },
    SET_BAN_VALIDATION_ERROR(error: string): void {
      this.banValidationError = error;
    },
    SET_QUEUEDATA(queueData: QueueData[]): void {
      this.queuedata = queueData;
    },
    SET_AVAILABLEPROXIES(availableProxies: Proxy[]): void {
      this.availableProxies = availableProxies;
    },
    SET_SEARCHED_PROXIES_FOR_BATTLETAG(proxies: ProxySettings): void {
      this.proxiesSetForSearchedPlayer = proxies;
    },
    SET_SEARCHED_PLAYER_BTAG(battleTag: string): void {
      this.searchedBattletag = battleTag;
    },
    SET_MODIFIED_PROXIES(overridesList: OverridesList): void {
      this.modifiedProxies.nodeOverrides = overridesList.overrides;
    },
    SET_MODIFIED_AUTO_PROXIES(overridesList: OverridesList): void {
      this.modifiedProxies.automaticNodeOverrides = overridesList.overrides;
    },
    SET_PROXY_MODIFIED(val: boolean): void {
      this.proxyModified = val;
    },
    SET_MUTED_PLAYERS(mutedPlayers: GloballyMutedPlayer[]): void {
      this.globallyMutedPlayers = mutedPlayers;
    },
    SET_SHOW_JWT_EXPIRED_DIALOG(value: boolean): void {
      this.showJwtExpiredDialog = value;
    }
  },
});
