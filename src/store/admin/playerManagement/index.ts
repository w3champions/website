import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { AdminPlayerManagementState, PortraitDefinition } from "../types";
const mod = {
  namespaced: true,
  state: {
    allSpecialPortraits: [] as PortraitDefinition[],
    searchedPlayerSpecialPortraits: [] as number[],
  } as AdminPlayerManagementState,

  actions: {

    async loadAllSpecialPortraits(context: ActionContext<AdminState, RootState>) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const availablePortraits = await rootGetters.adminService.getAllSpecialPortraits(rootState.oauth.token);
      commit.SET_SPECIAL_PORTRAITS(availablePortraits);
    },

    async loadSpecialPortraitsForPlayer(
      context: ActionContext<AdminPlayerManagementState, RootState>,
      btag: string
    ): Promise<number[]> {
      const { rootGetters } = moduleActionContext(context, mod);
      const playerSettings = await rootGetters.personalSettingsService.retrievePersonalSetting(btag);

      const portraits = playerSettings.specialPictures.map(x => x.pictureId);
      return portraits;
    },

    async addPortraits(
      context: ActionContext<AdminPlayerManagementState, RootState>,
      btag: string,
      portraitIds: number[],
      tooltip: string
    ): Promise<void> {
      const { rootGetters, rootState } = moduleActionContext(context, mod);

      await rootGetters.adminService.putPortraits(
        rootState.oauth.token, 
        btag, 
        portraitIds, 
        tooltip
      );
    },

    async removePortraits(
      context: ActionContext<AdminPlayerManagementState, RootState>,
      btag: string,
      portraitIds: number[]
    ): Promise<void> {
      const { rootGetters, rootState } = moduleActionContext(context, mod);
      
      await rootGetters.adminService.deletePortraits(
        rootState.oauth.token, 
        btag, 
        portraitIds,
      );
    },
  },

  mutations: {
    SET_SPECIAL_PORTRAITS(state: AdminPlayerManagementState, specialPortraits: PortraitDefinition[]) {
      state.allSpecialPortraits = specialPortraits;
    },
  },
} as const;

export default mod;
