import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import {
  AdminState,
  BannedPlayer,
  LoadingScreenTip,
  NewsMessage,
} from "./types";
import moment from "moment";
const mod = {
  namespaced: true,
  state: {
    total: 0,
    players: [],
    news: [],
    tips: [],
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
  },
} as const;

export default mod;
