import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { AdminInfoMessageState, LoadingScreenTip, MessageOfTheDay, NewsMessage } from "./types";
import { useOauthStore } from "@/store/oauth/store";
import InfoMessageService from "@/services/InfoMessageService";

const mod = {
  namespaced: true,
  state: {
    messageOfTheDay: {} as MessageOfTheDay,
    news: [] as NewsMessage[],
    tips: [] as LoadingScreenTip[],
  } as AdminInfoMessageState,

  actions: {
    async loadNews(context: ActionContext<AdminInfoMessageState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      const news = await InfoMessageService.getNews();
      commit.SET_NEWS(news);
    },

    async editNews(context: ActionContext<AdminInfoMessageState, RootState>, newsMessage: NewsMessage) {
      const { dispatch } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.editNews(newsMessage, oauthStore.token);
      if (success) {
        await dispatch.loadNews();
      }
    },

    async deleteNews(context: ActionContext<AdminInfoMessageState, RootState>, newsMessage: NewsMessage) {
      const { dispatch } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.deleteNews(newsMessage, oauthStore.token);
      if (success) {
        await dispatch.loadNews();
      }
    },

    async loadTips(context: ActionContext<AdminInfoMessageState, RootState>) {
      const { commit } = moduleActionContext(context, mod);
      const tips = await InfoMessageService.getTips();
      commit.SET_TIPS(tips);
    },

    async editTip(context: ActionContext<AdminInfoMessageState, RootState>, loadingScreenTip: LoadingScreenTip) {
      const { dispatch } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.editTip(loadingScreenTip, oauthStore.token);
      if (success) {
        await dispatch.loadTips();
        return true;
      }
      return false;
    },

    async deleteTip(context: ActionContext<AdminInfoMessageState, RootState>, loadingScreenTip: LoadingScreenTip) {
      const { dispatch } = moduleActionContext(context, mod);
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.deleteTip(loadingScreenTip, oauthStore.token);
      if (success) {
        await dispatch.loadTips();
      }
    },
    async loadMotd(context: ActionContext<AdminInfoMessageState, RootState>): Promise<boolean> {
      const { commit } = moduleActionContext(context, mod);
      const motd = await InfoMessageService.getMotd();
      commit.SET_MOTD(motd);

      if (motd) return true;
      return false;
    },

    async setMotd(context: ActionContext<AdminInfoMessageState, RootState>, motd: MessageOfTheDay): Promise<boolean> {
      const { commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const response = await InfoMessageService.putMotd(motd, oauthStore.token);

      if (response) commit.SET_MOTD(motd);
      return response;
    }
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
