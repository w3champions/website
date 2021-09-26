import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import vueMoment from "vue-moment";
import VueI18n from "vue-i18n";
import languages from "@/locales/languages";
import VueCookies from "vue-cookies-ts";

Vue.use(VueCookies);
Vue.use(vueMoment);
Vue.use(VueI18n);

Vue.config.productionTip = false;

declare global {
  interface Window {
    _env_: {
      BASE_URL: string,
      IDENTIFICATION_URL: string,
      REDIRECT_URL: string
      LAUNCHER_UPDATE_URL: string,
      INGAME_STATIC_RESOURCES_URL: string,
      BNET_API_CLIENT_ID: string
    }
  }
}

const _apiUrl = window._env_.BASE_URL;
const _idUrl = window._env_.IDENTIFICATION_URL;
const _launcherUrl = window._env_.LAUNCHER_UPDATE_URL;
const _ingameUrlStaticResourcesUrl = window._env_.INGAME_STATIC_RESOURCES_URL;
const _bnetApiClientId = window._env_.BNET_API_CLIENT_ID;

export const API_URL = _apiUrl;
export const IDENTIFICATION_URL = _idUrl;
const getUrl = window.location;
export const REDIRECT_URL = getUrl.protocol + "//" + getUrl.host + "/login";
export const LAUNCHER_UPDATE_URL = _launcherUrl;
export const INGAME_STATIC_RESOURCES_URL = _ingameUrlStaticResourcesUrl;
export const BNET_API_CLIENT_ID = _bnetApiClientId;

const i18n = new VueI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: languages,
});

new Vue({
  i18n,
  router,
  store: store.original,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
