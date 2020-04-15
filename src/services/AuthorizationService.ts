export default class AuthorizationService {
  public async authorize(code: string): Promise<string> {
    const url = `https://eu.battle.net/oauth/token?region=eu&code=${code}&grant_type=authorization_code&redirect_uri=http://localhost:8080/login&client_id=d7bd6dd46e2842c8a680866759ad34c2&client_secret=7qs8iu2dcX4ZrURpIpezwZJHNM7OJmXg`;
    const response = await fetch(url, {
      method: "POST",
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
