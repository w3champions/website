import { BlizzardToken, TwitchToken } from "@/store/oauth/types";
import { API_URL, REDIRECT_URL } from "@/main";
import Vue from "vue";

const BnetCookieKey = "BnetAuth";

export default class AuthorizationService {
  public async authorize(code: string): Promise<BlizzardToken> {
    const url = `${API_URL}api/oauth/token?code=${code}&redirectUri=${REDIRECT_URL}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public async authorizeWithTwitch(): Promise<TwitchToken> {
    const url = `${API_URL}api/oauth/twitch`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  public async loadAuthCookie(): Promise<string> {
    const cookie = Vue.cookies.get(BnetCookieKey);
    return (cookie as string) ?? "";
  }

  public async saveAuthToken(token: BlizzardToken) {
    Vue.cookies.set(BnetCookieKey, token.access_token, {
      expires: token.expires_in,
    });
  }

  public deleteAuthCookie() {
    Vue.cookies.remove(BnetCookieKey);
  }

  public async getProfile(bearer: string): Promise<any> {
    const url = `${API_URL}api/oauth/battleTag?bearer=${bearer}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data;
  }
}
