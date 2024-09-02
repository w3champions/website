import { API_URL } from "@/main";
import { PersonalSetting, ProfilePicture } from "@/store/personalSettings/types";
import { authorizedFetch } from "@/helpers/general";

export default class PersonalSettingsService {
  public static async retrievePersonalSetting(battleTag: string): Promise<PersonalSetting> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(battleTag)}`;

    const response = await fetch(url);
    if (!response) return {} as PersonalSetting;
    return await response.json();
  }

  public static async savePersonalSettings(
    battleTag: string,
    value: PersonalSetting,
    authToken: string,
  ): Promise<boolean> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(battleTag)}/?authorization=${authToken}`;
    const response = await authorizedFetch("PUT", url, authToken, JSON.stringify(value));
    return response.ok;
  }

  public static async setAvatar(
    battleTag: string,
    value: ProfilePicture,
    authToken: string,
  ): Promise<boolean> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(battleTag)}/profile-picture?authorization=${authToken}`;

    const post = {
      pictureId: value.pictureId,
      avatarCategory: value.race,
      description: value.description,
      isClassic: value.isClassic,
    };
    const response = await authorizedFetch("PUT", url, authToken, JSON.stringify(post));
    return response.ok;
  }
}
