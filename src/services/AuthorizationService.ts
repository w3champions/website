import { BnetOAuthRegion, type TwitchToken, type W3cToken } from "@/store/oauth/types";
import { REDIRECT_URL } from "@/config/env";
import { isJwtExpired } from "@/helpers/sso";
import Cookies from "js-cookie";

const w3CAuth = "W3ChampionsJWT";
const w3CAuthRegion = "W3ChampionsAuthRegion";
const IDENTIFICATION_URL = window._env_.IDENTIFICATION_URL;

/**
 * Outcome of a single /api/oauth/user-info check:
 *   - "valid":   not expired AND 200 — the JWT is accepted.
 *   - "invalid": expired OR 401/403 — genuine auth failure; the cookie is stale/revoked.
 *   - "error":   5xx, any other non-ok status, a JSON parse failure on a 200, or a thrown
 *                fetch (network/DNS/CORS) — transient; the cookie must NOT be cleared.
 */
export type SessionStatus = "valid" | "invalid" | "error";

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

  /**
   * Ends the identification-service OIDC SSO session by clearing its
   * `__Host-w3c-idp-session` cookie, so logging out of the website also ends SSO. That
   * cookie is HttpOnly on the id-service host, so it can only be cleared server-side; a
   * hidden `<img>` GET is enough — the browser honours the response's clearing
   * `Set-Cookie` even though it can't read the (204) body, and an image load needs no
   * CORS. Best-effort and fire-and-forget: a failure here must never break local logout.
   * Without it, a fresh OIDC login (e.g. Quackback) would silently reuse the up-to-30-min
   * IdP session after a website logout instead of re-prompting for Battle.net.
   */
  public static clearIdpSession(): void {
    try {
      const image = new Image();
      image.src = `${IDENTIFICATION_URL}connect/idp-logout?t=${Date.now()}`;
    } catch {
      // best-effort: never let SSO-logout cleanup throw out of logout()
    }
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

  /**
   * Single status-aware /api/oauth/user-info call returning BOTH the status and the
   * parsed profile, so callers never need a second fetch (which would double the
   * transient-failure surface and could throw or falsely report "valid"). Enforces
   * exp client-side first (the endpoint validates the signature but NOT lifetime, so
   * it returns 200 for an expired-but-present cookie; the handoff DOES enforce exp).
   * A "valid" result always carries a parsed profile; "invalid"/"error" carry null.
   */
  public static async getSessionProfile(jwt: string): Promise<{ status: SessionStatus; profile: W3cToken | null }> {
    if (isJwtExpired(jwt)) return { status: "invalid", profile: null };

    try {
      const url = `${IDENTIFICATION_URL}api/oauth/user-info?jwt=${encodeURIComponent(jwt)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        try {
          return { status: "valid", profile: (await response.json()) as W3cToken };
        } catch {
          // 200 but the body didn't parse — treat as transient, not a hydrated session.
          return { status: "error", profile: null };
        }
      }
      if (response.status === 401 || response.status === 403) return { status: "invalid", profile: null };
      return { status: "error", profile: null };
    } catch {
      return { status: "error", profile: null }; // network / CORS / DNS
    }
  }

  /**
   * Status-only session check (SsoContinue needs the status, not the body). Thin
   * wrapper over getSessionProfile so there is ONE user-info request implementation.
   */
  public static async validateSession(jwt: string): Promise<SessionStatus> {
    return (await AuthorizationService.getSessionProfile(jwt)).status;
  }
}
