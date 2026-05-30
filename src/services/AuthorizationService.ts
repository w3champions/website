import { BnetOAuthRegion, type TwitchToken, type W3cToken } from "@/store/oauth/types";
import { REDIRECT_URL } from "@/main";
import Cookies from "js-cookie";

const w3CAuth = "W3ChampionsJWT";
const w3CAuthRegion = "W3ChampionsAuthRegion";
const IDENTIFICATION_URL = window._env_.IDENTIFICATION_URL;

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

    // fetch() does not reject on 4xx/5xx, so surface the IdP's error code (e.g.
    // MISSING_WARCRAFT_3) as a thrown Error for the caller's try/catch. Without
    // this the body would parse as an undefined token and the failure would be
    // swallowed (hanging spinner). A non-JSON / shapeless error body maps to
    // "GENERIC" so Login.vue falls back to the generic error message.
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const code = body && typeof body.errorCode === "string" ? body.errorCode : "GENERIC";
      throw new Error(code);
    }

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

  public static loadAuthCookie(): string {
    const cookie = Cookies.get(w3CAuth);
    return (cookie as string) ?? "";
  }

  public static loadAuthRegionCookie(): BnetOAuthRegion {
    const cookie = Cookies.get(w3CAuthRegion);
    return (cookie as BnetOAuthRegion) ?? BnetOAuthRegion.eu;
  }

  public static saveAuthRegion(region: BnetOAuthRegion): void {
    Cookies.set(w3CAuthRegion, region, { expires: 365 });
  }

  public static saveAuthToken(token: W3cToken): void {
    Cookies.set(w3CAuth, token.jwt, { expires: 365 });
  }

  public static deleteAuthCookie(): void {
    Cookies.remove(w3CAuth);
    Cookies.remove(w3CAuthRegion);
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
