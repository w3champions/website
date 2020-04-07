import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import vueMoment from "vue-moment";
import VueI18n from "vue-i18n";
import languages from "@/locales/languages";

Vue.use(vueMoment);

Vue.config.productionTip = false;

const _apiUrl = (window as any)._env_.BASE_URL

export const API_URL = _apiUrl;

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: languages
});

new Vue({
  i18n,
  router,
  store: store.original,
  vuetify,
  render: h => h(App)
}).$mount("#app");
