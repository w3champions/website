import { AdminReplayManagementState, ReplayChatLog } from "../types";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/AdminService";
import { defineStore } from "pinia";

export const useReplayManagementStore = defineStore("replayManagement", {
  state: (): AdminReplayManagementState => ({
    chatLog: {} as ReplayChatLog,
  }),
  actions: {
    async loadChatLog(matchId: string) {
      const oauthStore = useOauthStore();
      const chatLog = await AdminService.getChatLog(oauthStore.token, matchId);
      this.SET_CHAT_LOG_DATA(chatLog);
    },
    SET_CHAT_LOG_DATA(chatLog: ReplayChatLog): void {
      this.chatLog = chatLog;
    },
  },
});
