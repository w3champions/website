import { W3cToken, TwitchToken } from "@/store/oauth/types";
import { API_URL, REDIRECT_URL } from "@/main";
import Vue from "vue";

const w3CAuth = "W3CAuth";

export default class AuthorizationService {
  public async authorize(code: string): Promise<W3cToken> {
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

  public async logoutEverywhere(code: string): Promise<boolean> {
    const url = `${API_URL}api/oauth/token?authorization=${code}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.ok;
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
    const cookie = Vue.cookies.get(w3CAuth);
    return (cookie as string) ?? "";
  }

  public async saveAuthToken(token: W3cToken) {
    Vue.cookies.set(w3CAuth, token.token, {
      expires: Infinity,
    });
  }

  public deleteAuthCookie() {
    Vue.cookies.remove(w3CAuth);
  }

  public async getProfile(bearer: string): Promise<W3cToken | null> {
    const url = `${API_URL}api/oauth/battleTag?bearer=${bearer}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.status === 204 ? null : await response.json();

  }
}
