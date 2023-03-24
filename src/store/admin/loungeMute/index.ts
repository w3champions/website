import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { LoungeMuteState, LoungeMute, LoungeMuteResponse } from "@/store/admin/loungeMute/types";
import { useOauthStore } from "@/store/oauth/store";
import AdminService from "@/services/AdminService";

const mod = {
  namespaced: true,
  state: {
    loungeMutedPlayers: [] as LoungeMuteResponse[]
  } as LoungeMuteState,

  actions: {
      async loadLoungeMutes(
      context: ActionContext<LoungeMuteState, RootState>
    ): Promise<void> {
      const { commit } = moduleActionContext(context, mod);

      const oauthStore = useOauthStore();
      const loungeMutes = await AdminService.getLoungeMutes(oauthStore.token);

      commit.SET_LOUNGE_MUTED_PLAYERS(loungeMutes);
    },

    async addLoungeMute(context: ActionContext<LoungeMuteState, RootState>, loungeMute: LoungeMute): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.postLoungeMute(oauthStore.token, loungeMute);
    },

    async deleteLoungeMute(context: ActionContext<LoungeMuteState, RootState>, battleTag: string): Promise<void> {
      const oauthStore = useOauthStore();
      await AdminService.deleteLoungeMute(oauthStore.token, battleTag);
    },
  },
  mutations: {
    SET_LOUNGE_MUTED_PLAYERS(state: LoungeMuteState, mutedPlayers: LoungeMuteResponse[]) {
        state.loungeMutedPlayers = mutedPlayers;
      },
  },
} as const;

export default mod;
