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

const _apiUrl = (window as any)._env_.BASE_URL;
const _idUrl = (window as any)._env_.IDENTIFICATION_URL;
const _redirectUrl = (window as any)._env_.REDIRECT_URL;
const _launcherUrl = (window as any)._env_.LAUNCHER_UPDATE_URL;
const _ingameUrlStaticResourcesUrl = (window as any)._env_.INGAME_STATIC_RESOURCES_URL;
const _bnetApiClientId = (window as any)._env_.BNET_API_CLIENT_ID;

export const API_URL = _apiUrl;
export const IDENTIFICATION_URL = _idUrl;
export const REDIRECT_URL = _redirectUrl;
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
