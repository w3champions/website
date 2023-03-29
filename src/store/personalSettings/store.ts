import { PersonalSetting, PersonalSettingsState, ProfilePicture } from "@/store/personalSettings/types";
import { useOauthStore } from "@/store/oauth/store";
import PersonalSettingsService from "@/services/PersonalSettingsService";
import { usePlayerStore } from "@/store/player/store";
import { defineStore } from "pinia";

export const usePersonalSettingsStore = defineStore("personalSettings", {
  state: (): PersonalSettingsState => ({
    personalSettings: {} as PersonalSetting,
  }),
  actions: {
    async loadPersonalSetting() {
      this.SET_PERSONAL_SETTING({} as PersonalSetting);
      const player = usePlayerStore();
      const battleTag = player.battleTag;
      if (!battleTag) return;
      const response = await PersonalSettingsService.retrievePersonalSetting(battleTag);
      this.SET_PERSONAL_SETTING(response);
    },
    async saveUserProfile(setting: PersonalSetting) {
      const oauthStore = useOauthStore();
      const player = usePlayerStore();
      const success =
        await PersonalSettingsService.savePersonalSettings(
          player.battleTag,
          setting,
          oauthStore.token,
        );
      if (success) this.SET_PERSONAL_SETTING(setting);
    },
    async saveAvatar(picture: ProfilePicture) {
      const oauthStore = useOauthStore();
      const player = usePlayerStore();
      const success = await PersonalSettingsService.setAvatar(
        player.battleTag,
        picture,
        oauthStore.token,
      );
      if (success) this.SET_PICTURE(picture);
    },
    SET_PERSONAL_SETTING(setting: PersonalSetting): void {
      this.personalSettings = setting;
    },
    SET_PICTURE(profilePicture: ProfilePicture): void {
      this.personalSettings = {
        ...this.personalSettings,
        profilePicture,
      };
    },
  },
});

