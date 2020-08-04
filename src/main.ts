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
const _redirectUrl = (window as any)._env_.REDIRECT_URL;
const _launcherUrl = (window as any)._env_.LAUNCHER_UPDATE_URL;
const _launcherEnabled = (window as any)._env_.IS_LAUNCHER_ENABLED === "true";

export const API_URL = _apiUrl;
export const REDIRECT_URL = _redirectUrl;
export const IS_LAUNCHER_ENABLED = _launcherEnabled;
export const LAUNCHER_UPDATE_URL = _launcherUrl;

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
