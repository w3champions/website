import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { AdminPlayerManagementState, ChangePortraitsCommand, PortraitDefinition } from "../types";
const mod = {
  namespaced: true,
  state: {
    allSpecialPortraits: [] as PortraitDefinition[],
    searchedPlayerSpecialPortraits: [] as number[],
  } as AdminPlayerManagementState,

  actions: {
    async loadAllSpecialPortraits(context: ActionContext<AdminPlayerManagementState, RootState>) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const availablePortraits = await rootGetters.adminService.getAllSpecialPortraits(rootState.oauth.token);
      commit.SET_SPECIAL_PORTRAITS(availablePortraits);
    },

    async loadSpecialPortraitsForPlayer(
      context: ActionContext<AdminPlayerManagementState, RootState>,
      btag: string
    ): Promise<void> {
      const { commit, rootGetters } = moduleActionContext(context, mod);
      const playerSettings = await rootGetters.personalSettingsService.retrievePersonalSetting(btag);
      if (playerSettings.specialPictures != null) {
        commit.SET_SEARCHED_PLAYER_SPECIAL_PORTRAITS(playerSettings.specialPictures.map(x => x.pictureId));
      } else {
        commit.SET_SEARCHED_PLAYER_SPECIAL_PORTRAITS([] as number[]);
      }
      commit.SET_MANAGED_PLAYER_BATTLETAG(btag);
    },

    async addPortraits(
      context: ActionContext<AdminPlayerManagementState, RootState>,
      portraitCommand: ChangePortraitsCommand
    ): Promise<void> {
      const { rootGetters, rootState } = moduleActionContext(context, mod);

      await rootGetters.adminService.putPortraits(rootState.oauth.token, portraitCommand);
    },

    async removePortraits(
      context: ActionContext<AdminPlayerManagementState, RootState>,
      portraitCommand: ChangePortraitsCommand
    ): Promise<void> {
      const { rootGetters, rootState } = moduleActionContext(context, mod);

      await rootGetters.adminService.deletePortraits(rootState.oauth.token, portraitCommand);
    },

    clearManagedPlayer(
      context: ActionContext<AdminPlayerManagementState, RootState>
    ): void {
      const { commit } = moduleActionContext(context, mod);
      commit.SET_MANAGED_PLAYER_BATTLETAG("");
    },
  },

  mutations: {
    SET_MANAGED_PLAYER_BATTLETAG(state: AdminPlayerManagementState, battleTag: string) {
      state.managedBattleTag = battleTag;
    },
    SET_SPECIAL_PORTRAITS(state: AdminPlayerManagementState, specialPortraits: PortraitDefinition[]) {
      state.allSpecialPortraits = specialPortraits;
    },
    SET_SEARCHED_PLAYER_SPECIAL_PORTRAITS(state: AdminPlayerManagementState, specialPortraits: number[]) {
      state.searchedPlayerSpecialPortraits = specialPortraits;
    },
  },
} as const;

export default mod;
