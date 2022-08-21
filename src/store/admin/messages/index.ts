import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { AdminInfoMessageState, LoadingScreenTip, MessageOfTheDay, NewsMessage } from "./types";

const mod = {
  namespaced: true,
  state: {
    messageOfTheDay: {} as MessageOfTheDay,
    news: [] as NewsMessage[],
    tips: [] as LoadingScreenTip[],
  } as AdminInfoMessageState,

  actions: {
    async loadNews(context: ActionContext<AdminInfoMessageState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const news = await rootGetters.infoMessageService.getNews();
      commit.SET_NEWS(news);
    },

    async editNews(context: ActionContext<AdminInfoMessageState, RootState>, newsMessage: NewsMessage) {
      const { rootGetters, rootState, dispatch } = moduleActionContext(context, mod);
      const success = await rootGetters.infoMessageService.editNews(newsMessage, rootState.oauth.token);
      if (success) {
        await dispatch.loadNews();
      }
    },

    async deleteNews(context: ActionContext<AdminInfoMessageState, RootState>, newsMessage: NewsMessage) {
      const { rootGetters, dispatch, rootState } = moduleActionContext(context, mod);
      const success = await rootGetters.infoMessageService.deleteNews(newsMessage, rootState.oauth.token);
      if (success) {
        await dispatch.loadNews();
      }
    },

    async loadTips(context: ActionContext<AdminInfoMessageState, RootState>) {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const tips = await rootGetters.infoMessageService.getTips();
      commit.SET_TIPS(tips);
    },

    async editTip(context: ActionContext<AdminInfoMessageState, RootState>, loadingScreenTip: LoadingScreenTip) {
      const { rootGetters, rootState, dispatch } = moduleActionContext(context, mod);
      const success = await rootGetters.infoMessageService.editTip(loadingScreenTip, rootState.oauth.token);
      if (success) {
        await dispatch.loadTips();
        return true;
      }
      return false;
    },

    async deleteTip(context: ActionContext<AdminInfoMessageState, RootState>, loadingScreenTip: LoadingScreenTip) {
      const { rootGetters, dispatch, rootState } = moduleActionContext(context, mod);
      const success = await rootGetters.infoMessageService.deleteTip(loadingScreenTip, rootState.oauth.token);
      if (success) {
        await dispatch.loadTips();
      }
    },
    async loadMotd(context: ActionContext<AdminInfoMessageState, RootState>): Promise<boolean> {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const motd = await rootGetters.infoMessageService.getMotd();
      commit.SET_MOTD(motd);

      if (motd) return true;
      return false;
    },

    async setMotd(context: ActionContext<AdminInfoMessageState, RootState>, motd: MessageOfTheDay): Promise<boolean> {
      const { commit, rootState, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.infoMessageService.putMotd(motd, rootState.oauth.token);

      if (response) commit.SET_MOTD(motd);
      return response;
    },
  },

  mutations: {
    SET_NEWS(state: AdminInfoMessageState, news: NewsMessage[]) {
      state.news = news;
    },
    SET_TIPS(state: AdminInfoMessageState, tips: LoadingScreenTip[]) {
      state.tips = tips;
    },
    SET_MOTD(state: AdminInfoMessageState, motd: MessageOfTheDay) {
      state.messageOfTheDay = motd;
    },
  },
} as const;

export default mod;
