import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";
import TrovoIcon from "@/components/player/TrovoIcon.vue";
import LiquipediaIcon from "@/components/player/LiquipediaIcon.vue";
import W3infoIcon from "@/components/player/W3infoIcon.vue";

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#1976d2",
          "primary-lighten5": "#e3f2fd",
          "primary-darken2": "#1565c0",
          secondary: "#424242",
          accent: "#82B1FF",
          error: "#FF5252",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FFC107",
          gold: "#FFD428",
          background: "var(--w3-bg-glass)",
          surface: "var(--v-w3-race-bg-base)",
          "w3-race-bg": "#e9e9e9",
          card: "var(--w3-bg-glass)",
          toolbar: "var(--v-w3-race-bg-base)",
          "app-bar": "var(--w3-bg-glass)",
          "navigation-drawer": "var(--w3-bg-glass)",
          "bottom-navigation": "var(--v-w3-race-bg-base)",
          "text-primary": "var(--v-w3-race-bg-base)",
          "text-secondary": "rgba(0, 0, 0, 0.75)",
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: "#1976d2",
          "primary-lighten5": "#e3f2fd",
          "primary-darken2": "#1565c0",
          secondary: "#424242",
          accent: "#82B1FF",
          error: "#FF5252",
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FFC107",
          gold: "#FFD428",
          background: "#121212",
          surface: "#1e1e1e",
          "w3-race-bg": "#e9e9e9",
          card: "var(--w3-bg-glass)",
          toolbar: "var(--v-w3-race-bg-base)",
          "app-bar": "var(--w3-bg-glass)",
          "navigation-drawer": "var(--w3-bg-glass)",
          "bottom-navigation": "var(--v-w3-race-bg-base)",
        },
      },
    },
  },
  icons: {
    defaultSet: "mdi",
    aliases: {
      ...aliases,
      trovo: TrovoIcon,
      liquipedia: LiquipediaIcon,
      w3info: W3infoIcon,
    },
    sets: {
      mdi,
    },
  },
});

export function useVuetify() {
  return vuetify;
}

export default vuetify;
