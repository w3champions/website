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

const _apiUrl = (window as any)._env_.STATISTIC_SERVICE_URL;
const _idUrl = (window as any)._env_.IDENTIFICATION_SERVICE_URL;
const _chatUrl = (window as any)._env_.CHAT_SERVICE_URL;
const _redirectUrl = (window as any)._env_.REDIRECT_URL;
const _updateUrl = (window as any)._env_.UPDATE_SERVICE_URL;
const _ingameUrlStaticResourcesUrl = (window as any)._env_.INGAME_STATIC_RESOURCES_URL;
const _bnetApiClientId = (window as any)._env_.BNET_API_CLIENT_ID;

export const STATISTIC_SERVICE_URL = _apiUrl;
export const CHAT_SERVICE_URL = _chatUrl;
export const IDENTIFICATION_SERVICE_URL = _idUrl;
export const REDIRECT_URL = _redirectUrl;
export const UPDATE_SERVICE_URL = _updateUrl;
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
