import Vue from "vue";
import Vuetify from "vuetify/lib";
import TrovoIcon from "@/components/player/TrovoIcon.vue";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    options: { customProperties: true },
    themes: {
      dark: {
        "w3-race-bg": "#e9e9e9",
      },
      light: {
        "w3-race-bg": "#e9e9e9",
      }
    }
  },
  icons: {
    values: {
      trovo: {
        component: TrovoIcon,
      }
    }
  }
});
