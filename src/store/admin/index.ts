import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import {
  AdminState,
  BannedPlayer,
  LoadingScreenTip,
  NewsMessage,
  Proxy,
  QueueData,
  SearchedPlayer,
  ProxySettings,
  OverridesList,
  GloballyMutedPlayer,
  GlobalMute
} from "./types";
import moment from "moment";
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
    modifiedProxies: {nodeOverrides: [], automaticNodeOverrides: []} as ProxySettings,
    proxyModified: false,
    globallyMutedPlayers: [] as GloballyMutedPlayer[],
    managedPlayer: "",
  } as AdminState,
  
  actions: {
    async loadNews(context: ActionContext<AdminState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const news = await rootGetters.adminService.getNews();
      commit.SET_NEWS(news);
    },

    async editNews(
      context: ActionContext<AdminState, RootState>,
      newsMessage: NewsMessage
    ) {
      const { rootGetters, rootState, dispatch } = moduleActionContext(
        context,
        mod
      );
      const success = await rootGetters.adminService.editNews(
        newsMessage,
        rootState.oauth.token
      );
      if (success) {
        await dispatch.loadNews();
      }
    },

    async deleteNews(
      context: ActionContext<AdminState, RootState>,
      newsMessage: NewsMessage
    ) {
      const { rootGetters, dispatch, rootState } = moduleActionContext(
        context,
        mod
      );
      const success = await rootGetters.adminService.deleteNews(
        newsMessage,
        rootState.oauth.token
      );
      if (success) {
        await dispatch.loadNews();
      }
    },

    async loadTips(context: ActionContext<AdminState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const tips = await rootGetters.adminService.getTips();
      commit.SET_Tips(tips);
    },

    async editTip(
      context: ActionContext<AdminState, RootState>,
      loadingScreenTip: LoadingScreenTip
    ) {
      const { rootGetters, rootState, dispatch } = moduleActionContext(
        context,
        mod
      );
      const success = await rootGetters.adminService.editTip(
        loadingScreenTip,
        rootState.oauth.token
      );
      if (success) {
        await dispatch.loadTips();
        return true;
      }
      return false;
    },

    async deleteTip(
      context: ActionContext<AdminState, RootState>,
      loadingScreenTip: LoadingScreenTip
    ) {
      const { rootGetters, dispatch, rootState } = moduleActionContext(
        context,
        mod
      );
      const success = await rootGetters.adminService.deleteTip(
        loadingScreenTip,
        rootState.oauth.token
      );
      if (success) {
        await dispatch.loadTips();
      }
    },

    async loadBannedPlayers(context: ActionContext<AdminState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const bannedPlayers = await rootGetters.adminService.getBannedPlayers();
      for (let i = 0; i < bannedPlayers.players.length; i++) {
        const player = bannedPlayers.players[i];
        const formattedDate = moment(
          player.endDate,
          "YYYY-MM-DD"
        ).toISOString();
        if (formattedDate) {
          player.endDate = formattedDate.substr(0, 10);
        }
      }
      commit.SET_BANNED_PLAYERS(bannedPlayers.players);
    },

    async postBan(
      context: ActionContext<AdminState, RootState>,
      bannedPlayer: BannedPlayer
    ) {
      const { state, commit, rootState, rootGetters } = moduleActionContext(
        context,
        mod
      );

      await rootGetters.adminService.postBan(
        bannedPlayer,
        rootState.oauth.token
      );

      let filterPlayer = state.players.find(
        (p) => p.battleTag === bannedPlayer.battleTag
      );

      if (filterPlayer) {
        filterPlayer = bannedPlayer;
      } else {
        commit.ADD_BANNED_PLAYER(bannedPlayer);
      }
    },

    async deleteBan(
      context: ActionContext<AdminState, RootState>,
      bannedPlayer: BannedPlayer
    ) {
      const { state, commit, rootState, rootGetters } = moduleActionContext(
        context,
        mod
      );

      await rootGetters.adminService.deleteBan(
        bannedPlayer,
        rootState.oauth.token
      );

      const bannedPlayers = state.players.filter(
        (p) => p.battleTag != bannedPlayer.battleTag
      );

      commit.SET_BANNED_PLAYERS(bannedPlayers);
    },

    async loadQueueData(
      context: ActionContext<AdminState, RootState>,
      token: string,
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const queuedata = await rootGetters.adminService.getQueueData(token);
      commit.SET_QUEUEDATA(queuedata);
    },

    async loadAvailableProxies(
      context: ActionContext<AdminState, RootState>,
      token: string,
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const availableProxies = await rootGetters.adminService.getAvailableProxies(token);
      commit.SET_AVAILABLEPROXIES(availableProxies);
    },

    async searchBnetTag(
      context: ActionContext<AdminState, RootState>,
      search: { searchText: string }
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      const searchedPlayers = await rootGetters.adminService.searchByTag(
        search.searchText,
        rootState.oauth.token
      );

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
      ) : Promise<ProxySettings> {
        const { commit, rootGetters, rootState } = moduleActionContext(
          context,
          mod
        );
  
        const proxiesSet = await rootGetters.adminService.getProxiesForBattletag(
          battleTag,
          rootState.oauth.token,
        );

        commit.SET_SEARCHED_PROXIES_FOR_BATTLETAG(proxiesSet);
        commit.SET_SEARCHED_PLAYER_BTAG(battleTag);

        return proxiesSet;
      },

      updateModifiedProxies(
        context: ActionContext<AdminState, RootState>,
        overrides: OverridesList
      ) : void {
        const { commit } = moduleActionContext(
          context,
          mod
        );
        
        if (overrides.isAutomatic) {
          commit.SET_MODIFIED_AUTO_PROXIES(overrides);
          return
        }
        
        commit.SET_MODIFIED_PROXIES(overrides);
      },

      proxyModified(
        context: ActionContext<AdminState, RootState>,
        val: boolean,
      ) : void {
        const { commit } = moduleActionContext(
          context,
          mod
        );

        commit.SET_PROXY_MODIFIED(val);
      },

      async putNewProxies(
        context: ActionContext<AdminState, RootState>,
        proxies: ProxySettings,
      ) : Promise<void> {
        const { commit, rootGetters, rootState } = moduleActionContext(
          context,
          mod
        );

        if (mod.state.proxiesSetForSearchedPlayer._id === undefined || null) {
          return;
        }
        const response = await rootGetters.adminService.putProxies(
          proxies, 
          mod.state.proxiesSetForSearchedPlayer._id,
          rootState.oauth.token);

        if (response.status == 200){
          commit.SET_SEARCHED_PROXIES_FOR_BATTLETAG(proxies);
        }
      },

      async getAltsForPlayer (
        context: ActionContext<AdminState, RootState>,
        btag: string,
      ) : Promise<string[]> {
        const { rootGetters, rootState } = moduleActionContext(
          context,
          mod
        );

        const getAlts = await rootGetters.adminService.getAltsForBattletag(
          btag,
          rootState.oauth.token,
        );

        return getAlts;
      },

      async loadGlobalMutes (
        context: ActionContext<AdminState, RootState>,
      ) : Promise<void> {
        const { commit, rootGetters, rootState } = moduleActionContext(
          context,
          mod
        );

        const getGlobalMutes = await rootGetters.adminService.getGlobalMutes(
          rootState.oauth.token,
        );

        commit.SET_MUTED_PLAYERS(getGlobalMutes);
      },

      async deleteGlobalMute(
        context: ActionContext<AdminState, RootState>,
        player: GloballyMutedPlayer,
      ) : Promise<void> {
        const { rootGetters, rootState } = moduleActionContext(
          context,
          mod
        );

        await rootGetters.adminService.deleteGlobalMute(
          rootState.oauth.token,
          player.id
        );
      },

      async addGlobalMute(
        context: ActionContext<AdminState, RootState>,
        mute: GlobalMute,
      ) : Promise<void> {
        const { rootGetters, rootState } = moduleActionContext(
          context,
          mod
        );

        await rootGetters.adminService.PutGlobalMute(
          rootState.oauth.token,
          mute
        );
      },

      async setManagedPlayer(
        context: ActionContext<AdminState, RootState>,
        battleTag: string,
      ) : Promise<void> {
        const { commit } = moduleActionContext(
          context,
          mod
        );
        commit.SET_MANAGED_PLAYER(battleTag);
      }

  },
  
  mutations: {
    SET_NEWS(state: AdminState, news: NewsMessage[]) {
      state.news = news;
    },
    SET_Tips(state: AdminState, tips: LoadingScreenTip[]) {
      state.tips = tips;
    },
    SET_BANNED_PLAYERS(state: AdminState, bannedPlayers: BannedPlayer[]) {
      state.players = bannedPlayers;
    },
    ADD_BANNED_PLAYER(state: AdminState, bannedPlayer: BannedPlayer) {
      state.players.push(bannedPlayer);
    },
    SET_QUEUEDATA(state: AdminState, queuedata: QueueData[]) {
      state.queuedata = queuedata;
    },
    SET_AVAILABLEPROXIES(state: AdminState, availableProxies: Proxy[]) {
      state.availableProxies = availableProxies;
    },
    SET_SEARCH_FOR_BNET_TAG(state: AdminState, searchedPlayers: SearchedPlayer[]) {
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
      state.modifiedProxies.automaticNodeOverrides = overridesList.overrides
    },
    SET_PROXY_MODIFIED(state: AdminState, val: boolean) {
      state.proxyModified = val;
    },
    SET_MUTED_PLAYERS(state: AdminState, mutedPlayers: GloballyMutedPlayer[]) {
      state.globallyMutedPlayers = mutedPlayers;
    },
    SET_MANAGED_PLAYER(state: AdminState, battleTag: string) {
      state.managedPlayer = battleTag;
    }
  },
} as const;

export default mod;