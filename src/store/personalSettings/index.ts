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
      const { commit, rootGetters, rootState  } = moduleActionContext(context, mod);

      const success = await rootGetters.personalSettingsService.setPersonalSettingMessage(rootState.player.battleTag, message);
      if (success) commit.SET_MESSAGE(message);
    },
    async saveHomepageInfo(
        context: ActionContext<PersonalSettingsState, RootState>,
        message: string
    ) {
      const { commit, rootGetters, rootState  } = moduleActionContext(context, mod);

      const success = await rootGetters.personalSettingsService.setPersonalSettingHomepage( rootState.player.battleTag, message);
      if (success) commit.SET_WEBSITE(message);
    },
    async saveAvatar(
        context: ActionContext<PersonalSettingsState, RootState>,
        picture: ProfilePicture
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const success = await rootGetters.personalSettingsService.setAvatar(rootState.player.battleTag, picture);
      if (success) commit.SET_PICTURE(picture);
    }
  },
  mutations: {
    SET_PERSONAL_SETTING(state: PersonalSettingsState, setting: PersonalSetting) {
      state.personalSettings = setting;
    },
    SET_MESSAGE(state: PersonalSettingsState, profileMessage: string) {
      state.personalSettings = {
        ...state.personalSettings,
        profileMessage
      };
    },
    SET_WEBSITE(state: PersonalSettingsState, homePage: string) {
      state.personalSettings = {
        ...state.personalSettings,
        homePage
      };
    },
    SET_PICTURE(state: PersonalSettingsState, profilePicture: ProfilePicture) {
      state.personalSettings = {
        ...state.personalSettings,
        profilePicture
      };
    }
  }
} as const;

export default mod;
