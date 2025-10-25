import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { createI18n } from "vue-i18n";
import languages from "@/locales/languages";
import VueCookies from "vue-cookies";
import { createPinia } from "pinia";
import "vuetify/styles";
import "@/scss/main.scss";

const pinia = createPinia();

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: languages,
});

const app = createApp(App);

app.use(VueCookies);
app.use(i18n);
app.use(pinia);
app.use(router);
app.use(vuetify);

app.mount("#app");

declare global {
  interface Window {
    _env_: {
      BASE_URL: string;
      IDENTIFICATION_URL: string;
      LAUNCHER_UPDATE_URL: string;
      INGAME_STATIC_RESOURCES_URL: string;
      BNET_API_CLIENT_ID: string;
      TURNSTILE_SITE_KEY: string;
    };
  }
}

const _apiUrl = window._env_.BASE_URL;
const _idUrl = window._env_.IDENTIFICATION_URL;
const _launcherUrl = window._env_.LAUNCHER_UPDATE_URL;
const _ingameUrlStaticResourcesUrl = window._env_.INGAME_STATIC_RESOURCES_URL;
const _bnetApiClientId = window._env_.BNET_API_CLIENT_ID;
const _turnstileSiteKey = window._env_.TURNSTILE_SITE_KEY;

export const API_URL = _apiUrl;
export const IDENTIFICATION_URL = _idUrl;
const getUrl = window.location;
export const REDIRECT_URL = getUrl.protocol + "//" + getUrl.host + "/login";
export const PATREON_REDIRECT_URL = getUrl.protocol + "//" + getUrl.host + "/patreon/callback";
export const LAUNCHER_UPDATE_URL = _launcherUrl;
export const INGAME_STATIC_RESOURCES_URL = _ingameUrlStaticResourcesUrl;
export const BNET_API_CLIENT_ID = _bnetApiClientId;
export const TURNSTILE_SITE_KEY = _turnstileSiteKey;
