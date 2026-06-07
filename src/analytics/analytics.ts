/**
 * Vue-side analytics + consent helpers.
 *
 * The GA4 script, Google Consent Mode wiring, and Silktide initialisation live
 * in `public/analytics-consent.js`, which loads before the Vue app. This module
 * only:
 *   - forwards SPA page-view events to GA4 when analytics is active, and
 *   - re-opens the Silktide consent banner ("Cookie settings").
 *
 * `window.__w3cAnalyticsActive` is set to true by `public/analytics-consent.js`
 * once GA4 has actually loaded (i.e. consent granted AND on a production host),
 * so `trackPageView` is a no-op before consent and on non-production hosts.
 */

type GtagFn = (...args: unknown[]) => void;

interface SilktideConsentManager {
  resetConsent?: () => void;
}

interface AnalyticsWindow extends Window {
  gtag?: GtagFn;
  __w3cAnalyticsActive?: boolean;
  silktideConsentManager?: SilktideConsentManager;
}

/** Send a GA4 page_view. No-op until the user has consented and GA4 is loaded. */
export function trackPageView(pagePath: string, pageTitle: string): void {
  const w = window as AnalyticsWindow;
  if (!w.__w3cAnalyticsActive || typeof w.gtag !== "function") return;
  w.gtag("event", "page_view", {
    page_location: window.location.href,
    page_path: pagePath,
    page_title: pageTitle,
  });
}

/** Re-open the Silktide banner so the user can change or withdraw consent. */
export function openCookieSettings(): void {
  const w = window as AnalyticsWindow;
  w.silktideConsentManager?.resetConsent?.();
}
