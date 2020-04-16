import { API_URL } from "@/main";
import {PersonalSetting} from "@/store/personalSettings/types";
import AuthorizationService from "@/services/AuthorizationService";

export default class PersonalSettingsService {
  public async retrievePersonalSetting(
      battleTag: string
  ): Promise<PersonalSetting> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(battleTag)}`;

    const response = await fetch(url);
    if (!response) return {} as PersonalSetting;
    return await response.json();
  }

  public async setPersonalSettingMessage(
      value: string
  ): Promise<boolean> {
    const authorizationService = new AuthorizationService();
    const cookie = await authorizationService.loadAuthCookie();

    const url = `${API_URL}api/personal-settings/profile-message?authentication=${cookie.accesToken}`;

    const post = { Value: value };
    const data = JSON.stringify(post);
    const response = await fetch(url, {
      method: "PUT",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });
    return response.ok;
  }

  public async setPersonalSettingHomepage(
      value: string
  ): Promise<boolean> {
    const authorizationService = new AuthorizationService();
    const cookie = await authorizationService.loadAuthCookie();

    const url = `${API_URL}api/personal-settings/home-page?authentication=${cookie.accesToken}`;

    const post = { Value: value };
    const data = JSON.stringify(post);
    const response = await fetch(url, {
      method: "PUT",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });
    return response.ok;
  }
}
