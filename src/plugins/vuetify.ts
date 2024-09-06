// Vuetify
import { createVuetify, type ThemeDefinition } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import TrovoIcon from "@/components/player/TrovoIcon.vue";
import LiquipediaIcon from "@/components/player/LiquipediaIcon.vue";
import W3infoIcon from "@/components/player/W3infoIcon.vue";

const human: ThemeDefinition = {
  dark: false,
  colors: {
    primary: "#1976d2",
    "w3-race-bg": "#e9e9e9",
  },
}

const orc: ThemeDefinition = {
  dark: false,
  colors: {
    primary: "#5c2604",
    "w3-race-bg": "#c7baa1",
  },
}

const nightelf: ThemeDefinition = {
  dark: true,
  colors: {
    primary: "#ffd428",
    "w3-race-bg": '#FFFFFF',
  },
}

const undead: ThemeDefinition = {
  dark: true,
  colors: {
    primary: "#ffd428",
    "w3-race-bg": "#000",
  },
}

export default createVuetify({
  theme: {
    defaultTheme: "human",
    themes: {
      human,
      orc,
      nightelf,
      undead
    },
  },
  components,
  directives,
});
