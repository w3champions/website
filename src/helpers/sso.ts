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
