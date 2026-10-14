/**
 * Vue-side analytics + consent helpers.
 *
 * The GA4 script, Google Consent Mode wiring, and Silktide initialisation live
 * in `public/analytics-consent.js`, which loads before the Vue app. This module
 * only:
 *   - forwards SPA page-view events to GA4 when analytics is active, and
 *   - opens the Silktide preferences modal ("Cookie settings").
 *
 * `window.__w3cAnalyticsActive` is set to true by `public/analytics-consent.js`
 * once GA4 has actually loaded (i.e. consent granted AND on a production host),
 * so `trackPageView` is a no-op before consent and on non-production hosts.
 */

type GtagFn = (...args: unknown[]) => void;

interface SilktideInstance {
  toggleModal?: (show: boolean) => void;
}

interface SilktideConsentManager {
  getInstance?: () => SilktideInstance | null;
  resetConsent?: () => void;
}

interface AnalyticsWindow extends Window {
  gtag?: GtagFn;
  __w3cAnalyticsActive?: boolean;
  silktideConsentManager?: SilktideConsentManager;
}

/**
 * Query params that carry credentials or one-time secrets (e.g. the Blizzard OAuth
 * redirect lands on `/login?code=...&state=...`). They must never reach GA4.
 * Keep in sync with the inline copy in `public/analytics-consent.js`.
 */
export const SENSITIVE_QUERY_PARAMS = ["code", "state", "jwt", "authorization", "token", "access_token", "ticket"];

/**
 * Remove sensitive query params (case-insensitively) from a URL or path, keeping other params (e.g. utm_*) and the hash.
 * The hash is intentionally kept: the site uses the OAuth authorization-code flow with createWebHistory,
 * so no tokens or codes ever appear in the fragment.
 */
export function sanitizeUrlForAnalytics(url: string): string {
  try {
    const parsed = new URL(url, "https://analytics.invalid");
    // Collect first, then delete: deleting while iterating would skip entries.
    const sensitiveKeys = [...new Set(parsed.searchParams.keys())].filter((key) => SENSITIVE_QUERY_PARAMS.includes(key.toLowerCase()));
    for (const key of sensitiveKeys) {
      parsed.searchParams.delete(key);
    }
    const isAbsolute = /^[a-z][a-z\d+.-]*:/i.test(url);
    return isAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

/** Send a GA4 page_view. No-op until the user has consented and GA4 is loaded. */
export function trackPageView(pagePath: string, pageTitle: string): void {
  const w = window as AnalyticsWindow;
  if (!w.__w3cAnalyticsActive || typeof w.gtag !== "function") return;
  w.gtag("event", "page_view", {
    page_location: sanitizeUrlForAnalytics(window.location.href),
    page_path: sanitizeUrlForAnalytics(pagePath),
    page_title: pageTitle,
  });
}

/** Open the Silktide preferences modal so the user can change or withdraw consent (non-destructive). */
export function openCookieSettings(): void {
  const w = window as AnalyticsWindow;
  w.silktideConsentManager?.getInstance?.()?.toggleModal?.(true);
}
