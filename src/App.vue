<template>
  <v-app class="w3app" :class="theme" :dark="isDarkTheme">
    <v-app-bar :class="{ darkmode: isDarkTheme }" app :dark="isDarkTheme">
      <div
        @click="$router.push({ path: '/' })"
        class="d-flex align-center pointer"
      >W3Champions - your Ladder for Warcraft III</div>
      <v-spacer></v-spacer>

      <v-btn class="button-margin" v-for="item in items" :key="item.title" text tile :to="item.to">
        <span class="mr-2 hidden-xs-only">{{ item.title }}</span>
        <v-icon>{{ item.icon }}</v-icon>
      </v-btn>

      <v-btn text tile class="button-margin" :href="blizzardOauthLink">
        <v-icon v-if="!isLoggedIn" class="mr-2 hidden-xs-only">mdi-account-circle-outline</v-icon>
        <v-icon v-if="isLoggedIn" class="mr-2 hidden-xs-only">mdi-account-circle</v-icon>
        <span v-if="isLoggedIn" class="mr-2 hidden-xs-only">{{ loginName }}</span>
      </v-btn>

      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn text tile v-on="on">
            <v-icon>mdi-invert-colors</v-icon>
          </v-btn>
        </template>
        <v-list class="theme-selector">
          <v-list-item @click="theme = 'human'">
            <v-list-item-title>Human</v-list-item-title>
          </v-list-item>
          <v-list-item @click="theme = 'orc'">
            <v-list-item-title>Orc</v-list-item-title>
          </v-list-item>
          <v-list-item @click="theme = 'nightelf'">
            <v-list-item-title>Night Elf</v-list-item-title>
          </v-list-item>
          <v-list-item @click="theme = 'undead'">
            <v-list-item-title>Undead</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-content>
      <transition
        name="warcraft"
        enter-active-class="warcraft-transition-enter-active"
        leave-active-class="warcraft-transition-leave-active"
      >
        <router-view :key="$route.fullPath" />
      </transition>
    </v-content>
    <v-footer padless class>
      <v-row justify="center" no-gutters>
        <v-btn text tile class="my-2" to="/imprint">Imprint</v-btn>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({})
export default class App extends Vue {
  public items = [
    { title: "Home", icon: "mdi-home-city", to: "/" },
    { title: "Rankings", icon: "mdi-view-list", to: "/Rankings" },
    { title: "Matches", icon: "mdi-controller-classic", to: "/Matches" },
    { title: "Statistics", icon: "mdi-chart-areaspline", to: "/OverallStatistics" },
    { title: "FAQ", icon: "mdi-help-circle-outline", to: "/Faq" },
  ];

  get blizzardOauthLink(): string {
    if (this.isLoggedIn) {
      return this.getPlayerPath(this.battleTag);
    }
    return "https://eu.battle.net/oauth/authorize?region=eu&response_type=code&client_id=d7bd6dd46e2842c8a680866759ad34c2&redirect_uri=http://localhost:8080/login";
  }

  private getPlayerPath(playerName: string) {
    return "/player/" + encodeURIComponent(`${playerName}@${this.$store.direct.state.rankings.gateway}`);
  }

  get isLoggedIn(): string {
    return this.$store.direct.state.oauth.token;
  }

  get loginName(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag?.split("#")[0];
  }

  get battleTag(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  private selectedTheme = "human";

  get isDarkTheme() {
    const isDark = this.theme === "nightelf" || this.theme === "undead";
    return isDark;
  }

  get theme(): string {
    return this.selectedTheme;
  }

  set theme(val: string) {
    window.localStorage.setItem("theme", val);
    this.selectedTheme = val;
    this.$vuetify.theme.dark = this.isDarkTheme;
    this.$store.direct.commit.SET_DARK_MODE(this.isDarkTheme);
  }

  mounted() {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.oauth.loadAuthCodeToState();
  }

  created() {
    const t = window.localStorage.getItem("theme");
    if (t && t.length > 0) {
      this.theme = t;
    }
  }
}
</script>

<style lang="scss">
@import "./scss/main.scss";

.level {
  color: white;
  text-shadow: 0.5px 0.5px 0.5px black, 0.5px -0.5px 0.5px black,
    -0.5px 0.5px 0.5px black, -0.5px -0.5px 0.5px black;
}

.profile {
  .v-tabs {
    .v-tabs-bar__content {
      border-bottom: 1px solid #cdcdcd !important;
    }
  }
}

.button-margin {
  margin-right: 10px;
}

.won {
  color: green;
  font-weight: 500;
}

.lost {
  color: red;
  font-weight: 500;
}

@font-face {
  font-family: "Friz Quadrata Regular OS";
  font-style: normal;
  font-weight: normal;
  src: local("Friz Quadrata Regular OS"),
    url("./assets/friz-quadrata-regular-os-5870333951e7c.woff") format("woff");

  * {
    font-family: "Friz Quadrata Regular OS" !important;
  }
}

.theme--dark.v-badge .v-badge__badge::after {
  border-color: #ffffff !important;
}

.theme--light.v-badge .v-badge__badge::after {
  border-color: #36393f !important;
}
</style>
