import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import VueI18n from "vue-i18n";
import { castToVueI18n, createI18n } from "vue-i18n-bridge";
import languages from "@/locales/languages";
import VueCookies from "vue-cookies";
import { createPinia, PiniaVuePlugin } from "pinia";

Vue.use(VueCookies);
Vue.use(VueI18n, { bridge: true });

// Only accessible after this initialisation!
const pinia = createPinia();
Vue.use(PiniaVuePlugin);

Vue.config.productionTip = false;

declare global {
  interface Window {
    _env_: {
      BASE_URL: string;
      IDENTIFICATION_URL: string;
      REDIRECT_URL: string;
      LAUNCHER_UPDATE_URL: string;
      INGAME_STATIC_RESOURCES_URL: string;
      BNET_API_CLIENT_ID: string;
    };
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

// Kovax comment:
// This i18n bridge is used instead of the regular i18n to make migration to vue3 easier.
// Code taken from here: https://vue-i18n.intlify.dev/guide/migration/vue2.html
// And here: https://www.npmjs.com/package/vue-i18n-bridge
// When it is time to migrate to vue 3, we will remove the vue-i18n-bridge package and upgrade vue-i18n to version 9 or more, which has vue 3 support (only).
// Also check out this link for more info on how to use with the composition api: https://vue-i18n.intlify.dev/guide/advanced/composition

// `createI18n` options is almost same vue-i18n-next (vue-i18n@v9.x) API
const i18n = castToVueI18n(createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: languages,
}, VueI18n));

Vue.use(i18n);

new Vue({
  i18n,
  router,
  vuetify,
  pinia,
  render: (h) => h(App),
}).$mount("#app");
