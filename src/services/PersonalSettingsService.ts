import { API_URL } from "@/main";
import {
  PersonalSetting,
  ProfilePicture,
} from "@/store/personalSettings/types";

export default class PersonalSettingsService {
  public async retrievePersonalSetting(
    battleTag: string
  ): Promise<PersonalSetting> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(
      battleTag
    )}`;

    const response = await fetch(url);
    if (!response) return {} as PersonalSetting;
    return await response.json();
  }

  public async setPersonalSettingMessage(
    battleTag: string,
    value: string,
    authToken: string
  ): Promise<boolean> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(
      battleTag
    )}/profile-message?authorization=${authToken}`;

    const post = { Value: value };
    const data = JSON.stringify(post);
    const response = await fetch(url, {
      method: "PUT",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  }

  public async setPersonalSettingHomepage(
    battleTag: string,
    value: string,
    authToken: string
  ): Promise<boolean> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(
      battleTag
    )}/home-page?authorization=${authToken}`;

    const post = { Value: value };
    const data = JSON.stringify(post);
    const response = await fetch(url, {
      method: "PUT",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  }

  public async setAvatar(
    battleTag: string,
    value: ProfilePicture,
    authToken: string
  ): Promise<boolean> {
    const url = `${API_URL}api/personal-settings/${encodeURIComponent(
      battleTag
    )}/profile-picture?authorization=${authToken}`;

    const post = { PictureId: value.pictureId, Race: value.race };
    const data = JSON.stringify(post);
    const response = await fetch(url, {
      method: "PUT",
      body: data,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  }
}
