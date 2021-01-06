import Vue from "vue";
import DatetimePicker from "vuetify-datetime-picker";
import Vuetify from "vuetify/lib";
import TrovoIcon from "@/components/player/TrovoIcon.vue";

Vue.use(Vuetify);
Vue.use(DatetimePicker);

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
