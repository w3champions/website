import { API_URL } from "@/main";
import {PersonalSetting, ProfilePicture} from "@/store/personalSettings/types";
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
      battleTag: string,
      value: string
  ): Promise<boolean> {
    const authorizationService = new AuthorizationService();
    const authToken = await authorizationService.loadAuthCookie();

    const url = `${API_URL}api/personal-settings/${encodeURIComponent(battleTag)}/profile-message?authentication=${authToken}`;

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
      battleTag: string,
      value: string
  ): Promise<boolean> {
    const authorizationService = new AuthorizationService();
    const authToken = await authorizationService.loadAuthCookie();

    const url = `${API_URL}api/personal-settings/${encodeURIComponent(battleTag)}/home-page?authentication=${authToken}`;

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

  public async setAvatar(
      battleTag: string,
      value: ProfilePicture
  ): Promise<boolean> {
    const authorizationService = new AuthorizationService();
    const authToken = await authorizationService.loadAuthCookie();

    const url = `${API_URL}api/personal-settings/${encodeURIComponent(battleTag)}/profile-picture?authentication=${authToken}`;

    const post = { PictureId: value.pictureId, Race: value.race };
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
