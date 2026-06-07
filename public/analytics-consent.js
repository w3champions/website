/**
 * Analytics + cookie-consent bootstrap for w3champions.com.
 *
 * Loaded from index.html (in <head>, AFTER the Silktide library, BEFORE the Vue
 * app). Responsibilities:
 *   1. Google Consent Mode v2 default (denied unless the visitor previously
 *      granted Analytics).
 *   2. window.__w3cLoadGa4(): idempotent GA4 loader, gated to production hosts.
 *   3. Initialise the Silktide Consent Manager (Essential + Analytics).
 *
 * The GA4 Measurement ID is a public value, identical across environments, so it
 * is hardcoded. The production-host guard prevents test/localhost traffic from
 * polluting the production GA4 property.
 */
(function () {
  "use strict";

  var GA4_MEASUREMENT_ID = "G-HQ4XC36WGT";
  var PROD_HOSTS = ["w3champions.com", "www.w3champions.com"];
  var ANALYTICS_CONSENT_KEY = "stcm.consent.analytics"; // Silktide _buildConsentKey('analytics') with no namespace = stcm.consent.<id>; keep in sync with init() config

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  // Guard: don't overwrite gtag if another script installed it first; both push to the shared window.dataLayer.
  window.gtag = window.gtag || gtag;

  function analyticsPreviouslyGranted() {
    try {
      return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "true";
    } catch (e) {
      return false;
    }
  }

  function isProdHost() {
    return PROD_HOSTS.indexOf(window.location.hostname) !== -1;
  }

  // 1. Consent Mode v2 default — MUST run before any gtag.js load.
  window.gtag("consent", "default", {
    analytics_storage: analyticsPreviouslyGranted() ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  // 2. Idempotent GA4 loader (production hosts only).
  var ga4Loaded = false;
  window.__w3cLoadGa4 = function () {
    if (ga4Loaded || !isProdHost() || !GA4_MEASUREMENT_ID) return;
    ga4Loaded = true;
    window.__w3cAnalyticsActive = true;

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
    document.head.appendChild(s);

    // gtag('js'/'config') push into window.dataLayer immediately; the async gtag.js replays the queue once it loads.
    window.gtag("js", new Date());
    window.gtag("config", GA4_MEASUREMENT_ID, { send_page_view: false });

    // Catch-up page_view for the current page (router.afterEach covers later
    // navigations). Deferred so it is queued after Silktide's synchronous
    // gtag('consent','update','granted') on a fresh Accept.
    setTimeout(function () {
      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      });
    }, 0);
  };

  // 3. Initialise Silktide Consent Manager.
  if (window.silktideConsentManager && typeof window.silktideConsentManager.init === "function") {
    window.silktideConsentManager.init({
      consentTypes: [
        {
          id: "essential",
          label: "Essential",
          description:
            "<p>Required for the website to work — signing in, security (bot protection), and remembering your cookie choices and preferences (theme, language). These cannot be switched off.</p>",
          required: true,
        },
        {
          id: "analytics",
          label: "Analytics",
          description:
            "<p>Help us understand how visitors use the site so we can improve it, via Google Analytics. These stay off until you allow them.</p>",
          required: false,
          defaultValue: false,
          gtag: "analytics_storage",
          onAccept: function () {
            window.__w3cLoadGa4();
          },
        },
      ],
      text: {
        prompt: {
          description:
            "<p>We use cookies to run the site and, with your consent, to measure usage. See our <a href=\"/cookies\">Cookie Policy</a> and <a href=\"/privacy\">Privacy Policy</a>.</p>",
          acceptAllButtonText: "Accept all",
          rejectNonEssentialButtonText: "Reject non-essential",
          preferencesButtonText: "Preferences",
        },
        preferences: {
          title: "Manage your cookie preferences",
          saveButtonText: "Save and close",
        },
      },
    });
  } else {
    // Library failed to load: keep analytics disabled (correct privacy default) but make it visible.
    console.warn("[w3c] Silktide Consent Manager unavailable; cookie banner not shown and analytics disabled.");
  }
})();
