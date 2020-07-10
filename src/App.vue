<template>
  <v-app class="w3app" :class="theme" :dark="isDarkTheme">
    <v-app-bar :class="{ darkmode: isDarkTheme }" app :dark="isDarkTheme">
      <div @click="$router.push({ path: '/' })" class="d-flex align-center pointer">
        <span class="d-none d-md-inline">W3Champions - your Ladder for Warcraft III</span>
      </div>
      <v-spacer></v-spacer>

      <v-btn
        class="button-margin"
        v-for="item in items"
        v-show="visible(item)"
        :key="item.title"
        text
        tile
        :to="item.to"
        :class="item.class"
      >
        <span class="mr-2 hidden-xs-only">{{ item.title }}</span>
        <v-icon>{{ item.icon }}</v-icon>
      </v-btn>

      <v-btn text tile @click="loginOrGoToProfile" v-if="!authCode">
        <v-icon v-if="!authCode" class="mr-2">mdi-account-circle-outline</v-icon>
      </v-btn>

      <v-menu offset-y v-if="authCode">
        <template v-slot:activator="{ on }">
          <v-btn text tile v-on="on">
            <v-icon class="mr-2">mdi-account-circle</v-icon>
            <span class="mr-2 hidden-xs-only">{{ loginName }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="openPlayerProfile">
            <v-list-item-title>View Profile</v-list-item-title>
          </v-list-item>
<!--          <v-list-item v-if="isClansActive" @click="downloadChatKey">-->
<!--            <v-list-item-title>Chat key</v-list-item-title>-->
<!--          </v-list-item>-->
          <v-list-item @click="logout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

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
import { REDIRECT_URL } from "@/main";

@Component({})
export default class App extends Vue {
  public items = [
    { title: "Home", icon: "mdi-home-city", to: "/" },
    {
      title: "Rankings",
      icon: "mdi-view-list",
      to: `/Rankings?season=1&gateway=${this.$store.direct.state.gateway}&gamemode=${this.$store.direct.state.rankings.gameMode}&league=${this.$store.direct.state.rankings.league}` },
    { title: "Matches", icon: "mdi-controller-classic", to: "/Matches" },
    {
      title: "Statistics",
      icon: "mdi-chart-areaspline",
      to: "/OverallStatistics",
    },
    {
      title: "Admin",
      icon: "mdi-account-tie",
      to: "/AdminOnlyView",
    },
    {
      title: "FAQ",
      icon: "mdi-help-circle-outline",
      to: "/Faq",
      class: "d-none d-md-flex",
    },
  ];

  loginOrGoToProfile() {
    if (this.authCode) {
      this.openPlayerProfile();
    } else {
      location.href = `https://eu.battle.net/oauth/authorize?region=eu&response_type=code&client_id=d7bd6dd46e2842c8a680866759ad34c2&redirect_uri=${REDIRECT_URL}`;
    }
  }

  logout() {
    this.$store.direct.dispatch.oauth.logout();
  }

  get chatApiKey(): string {
    return this.$store.direct.state.chat.apiKey;
  }

  public visible(item: any): boolean {
    if (item.title == "Admin" && !this.isAdmin) {
      return false;
    }
    return true;
  }

  public async downloadChatKey() {
    await this.$store.direct.dispatch.chat.createApiKey();

    var element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(this.chatApiKey)
    );
    element.setAttribute("download", "w3champions.key");

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  public openPlayerProfile() {
    this.$router.push({
      path: this.getPlayerPath(this.battleTag),
    });
  }

  private getPlayerPath(playerName: string) {
    return "/player/" + encodeURIComponent(playerName);
  }

  get authCode(): string {
    return this.$store.direct.state.oauth.token;
  }

  get loginName(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag?.split("#")[0];
  }

  get battleTag(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
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

  async mounted() {
    await this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.oauth.loadAuthCodeToState();
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    if (this.authCode) {
      await this.$store.direct.dispatch.oauth.loadBlizzardBtag(this.authCode);
    }
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
