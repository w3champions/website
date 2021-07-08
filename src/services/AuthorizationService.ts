import { W3cToken, TwitchToken, BnetOAuthRegion } from "@/store/oauth/types";
import { IDENTIFICATION_URL, REDIRECT_URL } from "@/main";
import Vue from "vue";

const w3CAuth = "W3ChampionsJWT";
const w3CAuthRegion = "W3ChampionsAuthRegion";

export default class AuthorizationService {
  public async authorize(code: string, region: BnetOAuthRegion = BnetOAuthRegion.eu): Promise<W3cToken> {
    const url = `${IDENTIFICATION_URL}api/oauth/token?code=${code}&redirectUri=${REDIRECT_URL}&region=${region}`;
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
    const url = `${IDENTIFICATION_URL}api/oauth/token?authorization=${code}`;
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
    const url = `${IDENTIFICATION_URL}api/oauth/twitch`;
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

  public async loadAuthRegionCookie(): Promise<BnetOAuthRegion> {
    const cookie = Vue.cookies.get(w3CAuthRegion);
    return (cookie as BnetOAuthRegion) ?? BnetOAuthRegion.eu;
  }

  public async saveAuthRegion(region: BnetOAuthRegion) {
    Vue.cookies.set(w3CAuthRegion, region, {
      expires: Infinity,
    })
  }

  public async saveAuthToken(token: W3cToken) {
    Vue.cookies.set(w3CAuth, token.jwt, {
      expires: Infinity,
    });
  }

  public deleteAuthCookie() {
    Vue.cookies.remove(w3CAuth);
    Vue.cookies.remove(w3CAuthRegion);
  }

  public async getProfile(bearer: string): Promise<W3cToken | null> {
    const url = `${IDENTIFICATION_URL}api/oauth/user-info?jwt=${bearer}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.status === 200 ? await response.json() : null;

  }
}
