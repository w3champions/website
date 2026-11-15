import type { AdminState, BanReasonTranslation, BattleTagModerationMap, CreateBanReasonTranslationRequest, GloballyMutedPlayer, GlobalMute, OverridesList, Proxy, ProxySettings, QueueData, UpdateBanReasonTranslationRequest } from "./types";
import { useOauthStore } from "@/store/oauth/store";
import { sameTag } from "@/store/admin/bans/tags";
import AdminService from "@/services/admin/AdminService";
import ModerationService from "@/services/admin/ModerationService";
import { defineStore } from "pinia";
import type { SmurfDetectionResult } from "@/services/admin/smurf-detection/SmurfDetectionResponse";

export const useAdminStore = defineStore("admin", {
  state: (): AdminState => ({
    total: 0,
    queuedata: [],
    availableProxies: [],
    proxiesSetForSearchedPlayer: {} as ProxySettings,
    searchedBattletag: "",
    modifiedProxies: {
      nodeOverrides: [],
      automaticNodeOverrides: [],
    },
    proxyModified: false,
    globallyMutedPlayers: [] as GloballyMutedPlayer[],
    mutesNextId: null,
    showJwtExpiredDialog: false,
    battleTagModerationStatus: {},
    banReasonTranslations: [] as BanReasonTranslation[],
  }),
  actions: {
    async loadQueueData(token: string) {
      const queuedata = await AdminService.getQueueData(token);
      if (queuedata) {
        this.SET_QUEUEDATA(queuedata);
      }
    },
    async loadAvailableProxies(token: string) {
      const availableProxies = await AdminService.getAvailableProxies(token);
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
      if (this.proxiesSetForSearchedPlayer._id == null) {
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
    async querySmurfsForIdentifier(identifierType: string, identifier: string, iterationDepth: number, generateExplanation: boolean): Promise<SmurfDetectionResult> {
      if (identifierType != "battleTag") {
        throw new Error("Unsupported identifier type");
      }
      const oauthStore = useOauthStore();
      return await AdminService.querySmurfsForIdentifier(identifierType, identifier, iterationDepth, generateExplanation, oauthStore.token);
    },
    async getSmurfIdentifierTypes(): Promise<string[]> {
      const oauthStore = useOauthStore();
      return await AdminService.getSmurfIdentifierTypes(oauthStore.token);
    },
    async loadGlobalMutes(searchQuery: string | undefined, nextId: number | null): Promise<void> {
      const oauthStore = useOauthStore();
      const response = await AdminService.getGlobalMutes(oauthStore.token, searchQuery, nextId);
      this.SET_MUTED_PLAYERS(response.globalChatBans);
      this.SET_MUTES_NEXT_ID(response.next_id);
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
    async loadBanReasonTranslations(): Promise<void> {
      const oauthStore = useOauthStore();
      const translations = await AdminService.getBanReasonTranslations(oauthStore.token);
      this.SET_BAN_REASON_TRANSLATIONS(translations);
    },
    async createBanReasonTranslation(request: CreateBanReasonTranslationRequest): Promise<BanReasonTranslation> {
      const oauthStore = useOauthStore();
      const translation = await AdminService.createBanReasonTranslation(request, oauthStore.token);
      await this.loadBanReasonTranslations();
      return translation;
    },
    async updateBanReasonTranslation(id: string, request: UpdateBanReasonTranslationRequest): Promise<BanReasonTranslation> {
      const oauthStore = useOauthStore();
      const translation = await AdminService.updateBanReasonTranslation(id, request, oauthStore.token);
      await this.loadBanReasonTranslations();
      return translation;
    },
    async deleteBanReasonTranslation(id: string): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.deleteBanReasonTranslation(id, oauthStore.token);
      await this.loadBanReasonTranslations();
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
    async loadModerationStatusForBattleTags(battleTags: string[]): Promise<void> {
      if (battleTags.length === 0) return;

      const oauthStore = useOauthStore();

      // Bans have their own badge (useBanStatusStore); the two mutes are loaded here in parallel
      const [globalMutes, loungeMutes] = await Promise.all([
        AdminService.getGlobalMutesByBattleTags(battleTags, oauthStore.token),
        ModerationService.getLoungeMutesByBattleTags(battleTags, oauthStore.token),
      ]);

      // Build lookup map, tags compared with sameTag
      const statusMap: BattleTagModerationMap = {};

      for (const bTag of battleTags) {
        const globalMute = globalMutes.find((m) => sameTag(m.battleTag, bTag));
        const loungeMute = loungeMutes.find((m) => sameTag(m.battleTag, bTag));

        statusMap[bTag] = {
          globalMute: globalMute,
          loungeMute: loungeMute,
        };
      }

      this.SET_BATTLETAG_MODERATION_STATUS(statusMap);
    },
    SET_MUTED_PLAYERS(mutedPlayers: GloballyMutedPlayer[]): void {
      this.globallyMutedPlayers = mutedPlayers;
    },
    SET_MUTES_NEXT_ID(next_id: number | null): void {
      this.mutesNextId = next_id;
    },
    SET_SHOW_JWT_EXPIRED_DIALOG(value: boolean): void {
      this.showJwtExpiredDialog = value;
    },
    SET_BATTLETAG_MODERATION_STATUS(map: BattleTagModerationMap): void {
      this.battleTagModerationStatus = map;
    },
    SET_BAN_REASON_TRANSLATIONS(translations: BanReasonTranslation[]): void {
      this.banReasonTranslations = translations;
    },
  },
});
