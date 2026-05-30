/**
 * SSO helpers for the /sso-continue handoff.
 * The allowed return origin is the identification-service for THIS environment
 * (prod vs test), derived from `window._env_.IDENTIFICATION_URL` — never hardcoded.
 * `isAllowedReturnUrl` stays pure (origin passed in) so it is unit-testable without `window`.
 */
export function identificationOrigin(): string {
  return new URL(window._env_.IDENTIFICATION_URL).origin;
}

export function handoffEndpoint(): string {
  return `${identificationOrigin()}/connect/handoff`;
}

/**
 * True only if `url` is an absolute URL whose exact origin equals `allowedOrigin`
 * (pass `identificationOrigin()`). Prevents open redirects; since the IdP is always
 * HTTPS, exact-origin match also enforces HTTPS.
 */
export function isAllowedReturnUrl(url: string, allowedOrigin: string): boolean {
  try {
    return new URL(url).origin === allowedOrigin;
  } catch {
    return false;
  }
}

/**
 * True if the JWT is expired, cannot be parsed, or has no `exp` claim. Used to gate
 * the SSO handoff, which enforces `exp` (HandoffJwtValidator, ValidateLifetime=true)
 * — unlike the legacy `/api/oauth/user-info` endpoint, which validates the signature
 * but NOT lifetime and so returns 200 for an expired-but-present cookie. Pure and
 * dependency-free; it does NOT verify the signature (the server does that).
 */
export function isJwtExpired(jwt: string): boolean {
  try {
    const part = jwt.split(".")[1];
    if (!part) return true;
    // base64url -> base64, then pad to a multiple of 4 so atob accepts it.
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== "number") return true; // no exp ⇒ unusable
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // undecodable ⇒ treat as unusable
  }
}
