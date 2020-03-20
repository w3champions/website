import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import vueMoment from 'vue-moment';

Vue.use(vueMoment);

Vue.config.productionTip = false;

let _apiUrl = '';

console.log(process.env);
if (process.env.NODE_ENV === 'development') {
  _apiUrl = 'http://test.w3champions.com:25049';
} else {
  _apiUrl = 'http://w3champions.com:25059';
}

export const API_URL = _apiUrl;

new Vue({
  router,
  store: store.original,
  vuetify,
  render: h => h(App)
}).$mount("#app");
