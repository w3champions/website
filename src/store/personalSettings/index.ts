import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import {
  PersonalSetting,
  PersonalSettingsState,
  ProfilePicture,
} from "@/store/personalSettings/types";

const mod = {
  namespaced: true,
  state: {
    personalSettings: {} as PersonalSetting,
  } as PersonalSettingsState,
  actions: {
    async loadPersonalSetting(
      context: ActionContext<PersonalSettingsState, RootState>
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );
      commit.SET_PERSONAL_SETTING({} as PersonalSetting);

      const battleTag = rootState.player.battleTag;
      if (!battleTag) return;

      const response = await rootGetters.personalSettingsService.retrievePersonalSetting(
        battleTag
      );

      commit.SET_PERSONAL_SETTING(response);
    },
    async saveUserProfile(
      context: ActionContext<PersonalSettingsState, RootState>,
      setting: PersonalSetting
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      const success = await rootGetters.personalSettingsService.savePersonalSettings(
        rootState.player.battleTag,
        setting,
        rootState.oauth.token
      );
      if (success) commit.SET_PERSONAL_SETTING(setting);
    },
    async saveAvatar(
      context: ActionContext<PersonalSettingsState, RootState>,
      picture: ProfilePicture
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      const success = await rootGetters.personalSettingsService.setAvatar(
        rootState.player.battleTag,
        picture,
        rootState.oauth.token
      );
      if (success) commit.SET_PICTURE(picture);
    },
  },
  mutations: {
    SET_PERSONAL_SETTING(
      state: PersonalSettingsState,
      setting: PersonalSetting
    ) {
      state.personalSettings = setting;
    },
    SET_PICTURE(state: PersonalSettingsState, profilePicture: ProfilePicture) {
      state.personalSettings = {
        ...state.personalSettings,
        profilePicture,
      };
    },
  },
} as const;

export default mod;
