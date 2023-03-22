import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { AdminReplayManagementState, ReplayChatLog } from "../types";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/AdminService";
const mod = {
  namespaced: true,
  state: {
    chatLog: {} as ReplayChatLog,
  } as AdminReplayManagementState,

  actions: {
    async loadChatLog(context: ActionContext<AdminReplayManagementState, RootState>, matchId: string) {
      const { commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const chatLog = await AdminService.getChatLog(oauthStore.token, matchId);
      commit.SET_CHAT_LOG_DATA(chatLog);
    },
  },

  mutations: {
    SET_CHAT_LOG_DATA(state: AdminReplayManagementState, chatLog: ReplayChatLog) {
      state.chatLog = chatLog;
    },
  },
} as const;

export default mod;
