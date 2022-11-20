import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { AdminReplayManagementState, ReplayChatLog } from "../types";
const mod = {
  namespaced: true,
  state: {
    chatLog: {} as ReplayChatLog,
  } as AdminReplayManagementState,

  actions: {
    async loadChatLog(context: ActionContext<AdminReplayManagementState, RootState>, matchId: string) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const chatLog = await rootGetters.adminService.getChatLog(rootState.oauth.token, matchId);
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
