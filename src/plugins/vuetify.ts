import Vue from "vue";
import Vuetify from "vuetify/lib";
import TrovoIcon from "@/components/player/TrovoIcon.vue";
import LiquipediaIcon from "@/components/player/LiquipediaIcon.vue";
import W3infoIcon from "@/components/player/W3infoIcon.vue";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    // This needs to be kept in sync the default selectedTheme in App.vue
    dark: false,
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
    iconfont: 'mdiSvg', // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
    values: {
      trovo: {
        component: TrovoIcon,
      },
      liquipedia: {
        component: LiquipediaIcon,
      },
      w3info: {
        component: W3infoIcon,
      },
    }
  }
});
