import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg";
import TrovoIcon from "@/components/player/TrovoIcon.vue";
import LiquipediaIcon from "@/components/player/LiquipediaIcon.vue";
import W3infoIcon from "@/components/player/W3infoIcon.vue";
import { human } from "./human";
import { orc } from "./orc";
import { nightelf } from "./nightelf";
import { undead } from "./undead";

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "human",
    variations: {
      colors: ["w3-race-bg", "success", "secondary"],
      lighten: 4,
      darken: 4,
    },
    themes: {
      human: human,
      orc: orc,
      nightelf: nightelf,
      undead: undead,
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

// Vuetify 2 color classes for reference:
// light: {
//   dark: false,
//   colors: {
//     primary: "#1976d2",
//     secondary: "#424242",
//     accent: "#82B1FF",
//     error: "#FF5252",
//     info: "#2196F3",
//     success: "#4CAF50",
//     warning: "#FFC107",
//     gold: "#FFD428",
//     background: "var(--w3-bg-glass)",
//     surface: "var(--v-w3-race-bg-base)",
//     "w3-race-bg": "#e9e9e9",
//     card: "var(--w3-bg-glass)",
//     toolbar: "var(--v-w3-race-bg-base)",
//     "app-bar": "var(--w3-bg-glass)",
//     "navigation-drawer": "var(--w3-bg-glass)",
//     "bottom-navigation": "var(--v-w3-race-bg-base)",
//     "text-primary": "var(--v-w3-race-bg-base)",
//     "text-secondary": "rgba(0, 0, 0, 0.75)",
//   },
// },
// dark: {
//   dark: true,
//   colors: {
//     primary: "#1976d2",
//     secondary: "#424242",
//     accent: "#82B1FF",
//     error: "#FF5252",
//     info: "#2196F3",
//     success: "#4CAF50",
//     warning: "#FFC107",
//     gold: "#FFD428",
//     background: "#121212",
//     surface: "#1e1e1e",
//     "w3-race-bg": "#e9e9e9",
//     card: "var(--w3-bg-glass)",
//     toolbar: "var(--v-w3-race-bg-base)",
//     "app-bar": "var(--w3-bg-glass)",
//     "navigation-drawer": "var(--w3-bg-glass)",
//     "bottom-navigation": "var(--v-w3-race-bg-base)",
//   },
// },

// Some default vuetify typography variables:
// Read more here: https://vuetifyjs.com/en/styles/text-and-typography

// Light mode:
// disabled
// rgba(0, 0, 0, 0.38) / #00000061

// medium-emphasis
// rgba(0, 0, 0, 0.6) / #00000099

// high-emphasis
// rgba(0, 0, 0, 0.87) / #000000de

// Dark mode:
// disabled
// rgba(255, 255, 255, 0.5) / #ffffff80

// medium-emphasis
// rgba(255, 255, 255, 0.7) / #ffffffb3

// high-emphasis
// rgba(255, 255, 255) / #FFFFFF
