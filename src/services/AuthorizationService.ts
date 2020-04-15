import {BlizzardToken} from "@/store/oauth/types";
import {API_URL, REDIRECT_URL} from "@/main";

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

    return await response.json();
  }

  public async getProfileName(bearer: string): Promise<string> {
    const url = `${API_URL}api/oauth/battleTag?bearer=${bearer}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    return data.battletag;
  }
}
