import { AdminInfoMessageState, LoadingScreenTip, MessageOfTheDay, NewsMessage } from "./types";
import { useOauthStore } from "@/store/oauth/store";
import InfoMessageService from "@/services/admin/InfoMessageService";
import { defineStore } from "pinia";

export const useInfoMessagesStore = defineStore("infoMessages", {
  state: (): AdminInfoMessageState => ({
    messageOfTheDay: {} as MessageOfTheDay,
    news: [] as NewsMessage[],
    tips: [] as LoadingScreenTip[],
  }),
  actions: {
    async loadNews() {
      const news = await InfoMessageService.getNews();
      this.SET_NEWS(news);
    },
    async editNews(newsMessage: NewsMessage) {
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.editNews(newsMessage, oauthStore.token);
      if (success) {
        await this.loadNews();
      }
    },
    async deleteNews(newsMessage: NewsMessage) {
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.deleteNews(newsMessage, oauthStore.token);
      if (success) {
        await this.loadNews();
      }
    },
    async loadTips() {
      const tips = await InfoMessageService.getTips();
      this.SET_TIPS(tips);
    },
    async editTip(loadingScreenTip: LoadingScreenTip) {
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.editTip(loadingScreenTip, oauthStore.token);
      if (success) {
        await this.loadTips();
        return true;
      }
      return false;
    },
    async deleteTip(loadingScreenTip: LoadingScreenTip) {
      const oauthStore = useOauthStore();
      const success = await InfoMessageService.deleteTip(loadingScreenTip, oauthStore.token);
      if (success) {
        await this.loadTips();
      }
    },
    async loadMotd(): Promise<boolean> {
      const motd = await InfoMessageService.getMotd();
      this.SET_MOTD(motd);
      return !!motd;
    },
    async setMotd(motd: MessageOfTheDay): Promise<boolean> {
      const oauthStore = useOauthStore();
      const response = await InfoMessageService.putMotd(motd, oauthStore.token);
      if (response) this.SET_MOTD(motd);
      return response;
    },
    SET_NEWS(news: NewsMessage[]): void {
      this.news = news;
    },
    SET_TIPS(tips: LoadingScreenTip[]): void {
      this.tips = tips;
    },
    SET_MOTD(motd: MessageOfTheDay): void {
      this.messageOfTheDay = motd;
    },
  },
});
