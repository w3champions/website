import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import playerManagementModule from "./playerManagement/index";
import tournamentsManagementModule from "./tournaments";
import replayManagementModule from "./replays/index";
import { PlayerProfile } from "@/store/player/types";

import {
  AdminState,
  BannedPlayer,
  Proxy,
  QueueData,
  ProxySettings,
  OverridesList,
  GloballyMutedPlayer,
  GlobalMute,
} from "./types";
import { useOauthStore } from "@/store/oauth/store";
import ProfileService from "@/services/ProfileService";
import AdminService from "@/services/AdminService";

const mod = {
  namespaced: true,
  state: {
    total: 0,
    players: [],
    news: [],
    tips: [],
    queuedata: [],
    availableProxies: [],
    searchedPlayers: [],
    proxiesSetForSearchedPlayer: {} as ProxySettings,
    searchedBattletag: "",
    modifiedProxies: {
      nodeOverrides: [],
      automaticNodeOverrides: [],
    } as ProxySettings,
    proxyModified: false,
    globallyMutedPlayers: [] as GloballyMutedPlayer[],
    banValidationError: "",
  } as AdminState,

  actions: {
    async loadBannedPlayers(
      context: ActionContext<AdminState, RootState>
    ) {
      const { commit } = moduleActionContext(context, mod);
      const bannedPlayers = await AdminService.getBannedPlayers();

      commit.SET_BANNED_PLAYERS(bannedPlayers.players);
    },

    async postBan(
      context: ActionContext<AdminState, RootState>,
      bannedPlayer: BannedPlayer
    ) {
      const { commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await AdminService.postBan(
        bannedPlayer,
        oauthStore.token
      );

      commit.SET_BAN_VALIDATION_ERROR(response);
    },

    resetBanValidationMessage(context: ActionContext<AdminState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_BAN_VALIDATION_ERROR("");
    },

    async deleteBan(
      context: ActionContext<AdminState, RootState>,
      bannedPlayer: BannedPlayer
    ) {
      const { state, commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      await AdminService.deleteBan(
        bannedPlayer,
        oauthStore.token
      );

      const bannedPlayers = state.players.filter(
        (p: BannedPlayer) => p.battleTag != bannedPlayer.battleTag
      );

      commit.SET_BANNED_PLAYERS(bannedPlayers);
    },

    async loadQueueData(
      context: ActionContext<AdminState, RootState>,
      token: string
    ) {
      const { commit } = moduleActionContext(context, mod);
      const queuedata = await AdminService.getQueueData(token);
      commit.SET_QUEUEDATA(queuedata);
    },

    async loadAvailableProxies(
      context: ActionContext<AdminState, RootState>,
      token: string
    ) {
      const { commit } = moduleActionContext(context, mod);
      const availableProxies =
        await AdminService.getAvailableProxies(token);
      commit.SET_AVAILABLEPROXIES(availableProxies);
    },

    async searchBnetTag(
      context: ActionContext<AdminState, RootState>,
      search: { searchText: string }
    ) {
      const { commit } = moduleActionContext(context, mod);

      const searchedPlayers = await ProfileService.searchPlayer(search.searchText);
      commit.SET_SEARCH_FOR_BNET_TAG(searchedPlayers);
    },

    async clearSearch(context: ActionContext<AdminState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_SEARCH_FOR_BNET_TAG([]);
      commit.SET_SEARCHED_PROXIES_FOR_BATTLETAG({} as ProxySettings);
    },

    async getProxiesForPlayer(
      context: ActionContext<AdminState, RootState>,
      battleTag: string
    ): Promise<ProxySettings> {
      const { commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const proxiesSet = await AdminService.getProxiesForBattletag(
        battleTag,
        oauthStore.token
      );

      commit.SET_SEARCHED_PROXIES_FOR_BATTLETAG(proxiesSet);
      commit.SET_SEARCHED_PLAYER_BTAG(battleTag);

      return proxiesSet;
    },

    updateModifiedProxies(
      context: ActionContext<AdminState, RootState>,
      overrides: OverridesList
    ): void {
      const { commit } = moduleActionContext(context, mod);

      if (overrides.isAutomatic) {
        commit.SET_MODIFIED_AUTO_PROXIES(overrides);
        return;
      }

      commit.SET_MODIFIED_PROXIES(overrides);
    },

    proxyModified(
      context: ActionContext<AdminState, RootState>,
      val: boolean
    ): void {
      const { commit } = moduleActionContext(context, mod);

      commit.SET_PROXY_MODIFIED(val);
    },

    async putNewProxies(
      context: ActionContext<AdminState, RootState>,
      proxies: ProxySettings
    ): Promise<void> {
      const { commit } = moduleActionContext(context, mod);

      if (mod.state.proxiesSetForSearchedPlayer._id === undefined || null) {
        return;
      }

      const oauthStore = useOauthStore();
      const response = await AdminService.putProxies(
        proxies,
        mod.state.proxiesSetForSearchedPlayer._id,
        oauthStore.token
      );

      if (response.status == 200) {
        commit.SET_SEARCHED_PROXIES_FOR_BATTLETAG(proxies);
      }
    },

    async getAltsForPlayer(
      context: ActionContext<AdminState, RootState>,
      btag: string
    ): Promise<string[]> {
      const oauthStore = useOauthStore();
      const getAlts = await AdminService.getAltsForBattletag(btag, oauthStore.token);

      return getAlts;
    },

    async loadGlobalMutes(
      context: ActionContext<AdminState, RootState>
    ): Promise<void> {
      const { commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const getGlobalMutes = await AdminService.getGlobalMutes(
        oauthStore.token
      );

      commit.SET_MUTED_PLAYERS(getGlobalMutes);
    },

    async deleteGlobalMute(
      context: ActionContext<AdminState, RootState>,
      player: GloballyMutedPlayer
    ): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.deleteGlobalMute(
        oauthStore.token,
        player.id
      );
    },

    async addGlobalMute(
      context: ActionContext<AdminState, RootState>,
      mute: GlobalMute
    ): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.putGlobalMute(oauthStore.token, mute);
    },
  },

  mutations: {
    SET_BANNED_PLAYERS(state: AdminState, bannedPlayers: BannedPlayer[]) {
      state.players = bannedPlayers;
    },
    SET_BAN_VALIDATION_ERROR(state: AdminState, error: string) {
      state.banValidationError = error;
    },
    SET_QUEUEDATA(state: AdminState, queuedata: QueueData[]) {
      state.queuedata = queuedata;
    },
    SET_AVAILABLEPROXIES(state: AdminState, availableProxies: Proxy[]) {
      state.availableProxies = availableProxies;
    },
    SET_SEARCH_FOR_BNET_TAG(state: AdminState, searchedPlayers: PlayerProfile[]) {
      state.searchedPlayers = searchedPlayers;
    },
    SET_SEARCHED_PROXIES_FOR_BATTLETAG(state: AdminState, proxies: ProxySettings) {
      state.proxiesSetForSearchedPlayer = proxies;
    },
    SET_SEARCHED_PLAYER_BTAG(state: AdminState, battleTag: string) {
      state.searchedBattletag = battleTag;
    },
    SET_MODIFIED_PROXIES(state: AdminState, overridesList: OverridesList) {
      state.modifiedProxies.nodeOverrides = overridesList.overrides;
    },
    SET_MODIFIED_AUTO_PROXIES(state: AdminState, overridesList: OverridesList) {
      state.modifiedProxies.automaticNodeOverrides = overridesList.overrides;
    },
    SET_PROXY_MODIFIED(state: AdminState, val: boolean) {
      state.proxyModified = val;
    },
    SET_MUTED_PLAYERS(state: AdminState, mutedPlayers: GloballyMutedPlayer[]) {
      state.globallyMutedPlayers = mutedPlayers;
    },
  },

  modules: {
    playerManagement: playerManagementModule,
    tournamentsManagement: tournamentsManagementModule,
    replayManagement: replayManagementModule,
  },
} as const;

export default mod;
