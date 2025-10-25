import { BnetOAuthRegion, TwitchToken, W3cToken } from "@/store/oauth/types";
import { IDENTIFICATION_URL, REDIRECT_URL } from "@/main";
import VueCookies from "vue-cookies";

const w3CAuth = "W3ChampionsJWT";
const w3CAuthRegion = "W3ChampionsAuthRegion";

export default class AuthorizationService {
  public static async authorize(code: string, region: BnetOAuthRegion = BnetOAuthRegion.eu): Promise<W3cToken> {
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

  public static async logoutEverywhere(code: string): Promise<boolean> {
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

  public static async authorizeWithTwitch(): Promise<TwitchToken> {
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

  public static async loadAuthCookie(): Promise<string> {
    const cookie = VueCookies.get(w3CAuth);
    return (cookie as string) ?? "";
  }

  public static async loadAuthRegionCookie(): Promise<BnetOAuthRegion> {
    const cookie = VueCookies.get(w3CAuthRegion);
    return (cookie as BnetOAuthRegion) ?? BnetOAuthRegion.eu;
  }

  public static async saveAuthRegion(region: BnetOAuthRegion) {
    VueCookies.set(w3CAuthRegion, region, Infinity); // Cookie never expires
  }

  public static async saveAuthToken(token: W3cToken) {
    VueCookies.set(w3CAuth, token.jwt, Infinity); // Cookie never expires
  }

  public static deleteAuthCookie(): void {
    VueCookies.remove(w3CAuth);
    VueCookies.remove(w3CAuthRegion);
  }

  public static async getProfile(bearer: string): Promise<W3cToken | null> {
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
