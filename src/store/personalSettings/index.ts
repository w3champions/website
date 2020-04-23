import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import {PersonalSetting, PersonalSettingsState, ProfilePicture} from "@/store/personalSettings/types";

const mod = {
  namespaced: true,
  state: {
    personalSettings: {} as PersonalSetting
  } as PersonalSettingsState,
  actions: {
    async loadPersonalSetting(
      context: ActionContext<PersonalSettingsState, RootState>
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);
      commit.SET_PERSONAL_SETTING({} as PersonalSetting);

      const response = await rootGetters.personalSettingsService.retrievePersonalSetting(rootState.player.battleTag);

      commit.SET_PERSONAL_SETTING(response);
    },
    async saveAditionalInfo(
        context: ActionContext<PersonalSettingsState, RootState>,
        message: string
    ) {
      const { rootGetters, rootState  } = moduleActionContext(context, mod);

      await rootGetters.personalSettingsService.setPersonalSettingMessage(rootState.player.battleTag, message);
    },
    async saveHomepageInfo(
        context: ActionContext<PersonalSettingsState, RootState>,
        message: string
    ) {
      const { rootGetters, rootState  } = moduleActionContext(context, mod);

      await rootGetters.personalSettingsService.setPersonalSettingHomepage( rootState.player.battleTag, message);
    },
    async saveAvatar(
        context: ActionContext<PersonalSettingsState, RootState>,
        picture: ProfilePicture
    ) {
      const { rootGetters, rootState } = moduleActionContext(context, mod);

      await rootGetters.personalSettingsService.setAvatar(rootState.player.battleTag, picture);
    }
  },
  mutations: {
    SET_PERSONAL_SETTING(state: PersonalSettingsState, setting: PersonalSetting) {
      state.personalSettings = setting;
    }
  }
} as const;

export default mod;
