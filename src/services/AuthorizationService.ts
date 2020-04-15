import {BlizzardToken} from "@/store/oauth/types";
import { API_URL, REDIRECT_URL } from "@/main";

export default class AuthorizationService {
  public async authorize(code: string): Promise<BlizzardToken> {
    const url = `${API_URL}api/oauth/token?code=${code}&redirectUri=${REDIRECT_URL}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    return data.access_token;
  }

  public async getProfileName(bearer: string): Promise<string> {
    const url = `https://eu.battle.net/oauth/userinfo`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`
      }
    });

    const data = await response.json();
    return data.battletag;
  }
}
