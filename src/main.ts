import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { createI18n } from "vue-i18n";
import languages from "@/locales/languages";
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

app.use(i18n);
app.use(pinia);
app.use(router);
app.use(vuetify);

app.mount("#app");
