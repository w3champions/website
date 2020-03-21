import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import vueMoment from 'vue-moment';
import VueI18n from "vue-i18n";

Vue.use(vueMoment);

Vue.config.productionTip = false;

let _apiUrl = '';

if (process.env.NODE_ENV === 'development') {
  _apiUrl = 'http://test.w3champions.com:25049';
} else {
  _apiUrl = 'http://w3champions.com:25059';
}

export const API_URL = _apiUrl;

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: 'en',
  fallbackLocale: 'en'
});

new Vue({
  i18n,
  router,
  store: store.original,
  vuetify,
  render: h => h(App)
}).$mount("#app");
