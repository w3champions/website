import { AdminState, BannedPlayer, BannedPlayersGetRequest, BannedPlayersResponse, BattleTagModerationMap, GloballyMutedPlayer, GlobalMute, OverridesList, Proxy, ProxySettings, QueueData } from "./types";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/admin/AdminService";
import ModerationService from "@/services/admin/ModerationService";
import { defineStore } from "pinia";
import { formatTimestampString } from "@/helpers/date-functions";
import { SmurfDetectionResult } from "@/services/admin/smurf-detection/SmurfDetectionResponse";
export const useAdminStore = defineStore("admin", {
  state: (): AdminState => ({
    total: 0,
    bannedPlayers: [],
    bannedPlayersCount: 0,
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
    mutesNextId: null,
    banValidationError: "",
    showJwtExpiredDialog: false,
    battleTagModerationStatus: {} as BattleTagModerationMap,
  }),
  actions: {
    async loadBannedPlayers(req: BannedPlayersGetRequest) {
      const oauthStore = useOauthStore();
      const bannedPlayers = await AdminService.getBannedPlayers(oauthStore.token, req);

      bannedPlayers.players.forEach((bannedPlayer) => {
        bannedPlayer.endDate = formatTimestampString(bannedPlayer.endDate, "yyyy-MM-dd HH:mm:ss");
        bannedPlayer.banInsertDate = formatTimestampString(bannedPlayer.banInsertDate, "yyyy-MM-dd HH:mm:ss");
      });

      this.SET_BANNED_PLAYERS(bannedPlayers);
    },
    async postBan(bannedPlayer: BannedPlayer) {
      const oauthStore = useOauthStore();
      const response = await AdminService.postBan(bannedPlayer, oauthStore.token);
      this.SET_BAN_VALIDATION_ERROR(response);
    },
    resetBanValidationMessage() {
      this.SET_BAN_VALIDATION_ERROR("");
    },
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
    SET_BANNED_PLAYERS(bannedPlayers: BannedPlayersResponse): void {
      this.bannedPlayers = bannedPlayers.players;
      this.bannedPlayersCount = bannedPlayers.total;
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
    async loadModerationStatusForBattleTags(battleTags: string[]): Promise<void> {
      if (battleTags.length === 0) return;

      const oauthStore = useOauthStore();

      // Fetch all three types in parallel
      const [bannedPlayers, globalMutes, loungeMutes] = await Promise.all([
        AdminService.getBannedPlayersByBattleTags(battleTags, oauthStore.token),
        AdminService.getGlobalMutesByBattleTags(battleTags, oauthStore.token),
        ModerationService.getLoungeMutesByBattleTags(battleTags, oauthStore.token),
      ]);

      // Build lookup map with case-insensitive matching
      const statusMap: BattleTagModerationMap = {};

      for (const bTag of battleTags) {
        const ban = bannedPlayers.find((b) => b.battleTag.toLowerCase() === bTag.toLowerCase());
        const globalMute = globalMutes.find((m) => m.battleTag.toLowerCase() === bTag.toLowerCase());
        const loungeMute = loungeMutes.find((m) => m.battleTag.toLowerCase() === bTag.toLowerCase());

        statusMap[bTag] = {
          ban: ban,
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
  },
});
