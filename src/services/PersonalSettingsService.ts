import { API_URL } from "@/main";
import {PersonalSetting} from "@/store/personalSettings/types";
import Vue from 'vue';

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
      message: string
  ): Promise<boolean> {
    const bearer = Vue.cookies.get("BnetAuth")?.toString() ?? "";

    const url = `${API_URL}api/personal-settings/profile-message?authentication=${bearer}`;

    const post = { Message: message };
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
