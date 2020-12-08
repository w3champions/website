import Vue from "vue";
import Vuetify from "vuetify/lib";
import TrovoIcon from "@/components/player/TrovoIcon.vue";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: false,
  },
  icons: {
    values: {
      trovo: {
        component: TrovoIcon,
      }
    }
  }
});
