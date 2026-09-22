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

// Slavic languages need "few" (2-4) and "many" forms; messages using these
// rules carry four variants: "zero | one | few | many". Locales without a
// rule here keep vue-i18n's default (zero | one | other). Clamped so a
// message that only has the English three (or fewer) forms — e.g. an en
// fallback while a translation is missing from the sheet — still resolves.
function slavicPluralRule(endsInOneIsSingular: boolean) {
  return (choice: number, choicesLength: number): number => {
    const index = (() => {
      if (choice === 0) return 0;
      const teen = choice % 100 > 10 && choice % 100 < 20;
      if (!teen && (endsInOneIsSingular ? choice % 10 === 1 : choice === 1)) return 1;
      if (!teen && choice % 10 >= 2 && choice % 10 <= 4) return 2;
      return 3;
    })();
    return Math.min(index, choicesLength - 1);
  };
}

const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: languages,
  pluralRules: {
    // ru/ua/sr: 21, 31, ... take the singular form; pl reserves it for exactly 1.
    ru: slavicPluralRule(true),
    ua: slavicPluralRule(true),
    sr: slavicPluralRule(true),
    pl: slavicPluralRule(false),
  },
});

const app = createApp(App);

app.use(i18n);
app.use(pinia);
app.use(router);
app.use(vuetify);

app.mount("#app");
