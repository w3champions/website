<template>
  <v-app class="w3app" :class="theme" :dark="isDarkTheme">
    <v-app-bar
      :class="{ darkmode: isDarkTheme }"
      app
      :dark="isDarkTheme"
      style="height: 60px"
    >
      <div
        @click="$router.push({ path: '/' })"
        class="d-flex align-center pointer"
        style="padding-top: 0px"
      >
        <div class="d-none d-md-inline">
          <div v-if="(theme == 'human') | (theme == 'orc')" id="app">
            <img src="./assets/logos/small-logo-full-black.png" />
          </div>
          <div v-else id="app">
            <img src="./assets/logos/small-logo-full.png" />
          </div>
        </div>
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
        <span class="mr-2 hidden-xs-only">
          {{ $t(`views_app.${item.title}`) }}
        </span>
        <v-icon>{{ item.icon }}</v-icon>
      </v-btn>

      <v-btn
        text
        tile
        @click="loginOrGoToProfile"
        v-if="!authCode"
        class="right-menu"
      >
        <v-icon v-if="!authCode" class="mr-2">
          mdi-account-circle-outline
        </v-icon>
        <sign-in-dialog v-model="showSignInDialog" v-on:region-change="saveLoginRegion"></sign-in-dialog>
      </v-btn>

      <v-menu offset-y v-if="authCode">
        <template v-slot:activator="{ on }">
          <v-btn text tile v-on="on" class="right-menu">
            <v-icon class="mr-2">mdi-account-circle</v-icon>
            <span class="mr-2 hidden-xs-only">{{ loginName }}</span>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="openPlayerProfile">
            <v-list-item-title>View Profile</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu offset-y class="menu-button">
        <template v-slot:activator="{ on }">
          <v-btn text tile v-on="on" class="right-menu">
            <v-icon>mdi-invert-colors</v-icon>
          </v-btn>
        </template>
        <v-list class="theme-selector">
          <v-list-item @click="theme = 'human'">
            <v-list-item-title>{{ $t("races.HUMAN") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="theme = 'orc'">
            <v-list-item-title>{{ $t("races.ORC") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="theme = 'nightelf'">
            <v-list-item-title>{{ $t("races.NIGHT_ELF") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="theme = 'undead'">
            <v-list-item-title>{{ $t("races.UNDEAD") }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu offset-y class="menu-button">
        <template v-slot:activator="{ on }">
          <v-btn text tile v-on="on" class="right-menu">
            <locale-icon
              :locale="savedLocale"
              :showTwoLetterCode="false"
            ></locale-icon>
          </v-btn>
        </template>
        <v-list class="locale-selector pa-1">
          <v-list-item
            v-for="(lang, i) in languages"
            :key="i"
            @click="savedLocale = i"
          >
            <locale-icon :locale="i"></locale-icon>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
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
import { getProfileUrl } from "./helpers/url-functions";
import SignInDialog from "@/components/common/SignInDialog.vue";
import { BnetOAuthRegion } from "./store/oauth/types";
import localeIcon from "@/components/common/LocaleIcon.vue";
import VueI18n from "node_modules/vue-i18n/types";

export type ItemType= {
  title: string;
  icon: string;
  to: string;
  class?: string;
}

@Component({ components: { SignInDialog, localeIcon } })
export default class App extends Vue {
  private _savedLocale = "en";
  private selectedTheme = "human";

  public items: ItemType[] = [
    {
      title: "tournaments",
      icon: "mdi-trophy",
      to: "/tournaments",
    },
    {
      title: "rankings",
      icon: "mdi-view-list",
      to: `/Rankings`,
    },
    {
      title: "matches",
      icon: "mdi-controller-classic",
      to: "/Matches",
    },
    {
      title: "statistics",
      icon: "mdi-chart-areaspline",
      to: "/OverallStatistics",
    },
    {
      title: "admin",
      icon: "mdi-account-tie",
      to: "/AdminOnlyView",
    },
    {
      title: "faq",
      icon: "mdi-help-circle-outline",
      to: "/Faq",
      class: "d-none d-md-flex",
    },
  ];

  loginOrGoToProfile() {
    if (this.authCode) {
      this.openPlayerProfile();
    } else {
      this.showSignInDialog = true;
    }
  }

  async saveLoginRegion({region, done}: {region: BnetOAuthRegion, done: () => void}) {
    await this.$store.direct.dispatch.oauth.saveLoginRegion(region);
    done()
  }    

  logout() {
    this.$store.direct.dispatch.oauth.logout();
  }

  public visible(item: any): boolean {
    if (item.title == "admin" && !this.isAdmin) {
      return false;
    }
    return true;
  }

  public openPlayerProfile(): void {
    this.$router.push({
      path: getProfileUrl(this.battleTag),
    });
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

  get isDarkTheme(): boolean {
    const isDark = this.theme === "nightelf" || this.theme === "undead";
    return isDark;
  }

  get themeColors(): unknown {
    switch(this.theme) {
      case "nightelf":
        return {
          primary: "#ffd428",
          "w3-race-bg": "#0d0718"
        };
      case "undead":
        return {
          primary: "#ffd428",
          "w3-race-bg": "#000",
        };
      case "orc":
        return {
          primary: "#5c2604",
          "w3-race-bg": "#c7baa1"
        };
      default:
        return {
          primary: "#1976d2",
          "w3-race-bg": "#e9e9e9"
        };
    }
  }

  get theme(): string {
    return this.selectedTheme;
  }

  set theme(val: string) {
    window.localStorage.setItem("theme", val);
    this.selectedTheme = val;
    this.$vuetify.theme.dark = this.isDarkTheme;
    this.setThemeColors();
    this.$store.direct.commit.SET_DARK_MODE(this.isDarkTheme);
  }

  set savedLocale(val: string) {
    this.$i18n.locale = val;
    this.$store.direct.dispatch.saveLocale(val);
  }

  get savedLocale(): string {
    return this.$store.direct.state.locale;
  }

  get languages(): VueI18n.LocaleMessages {
    return this.$i18n.messages;
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  private async init() {
    this.$store.direct.dispatch.loadLocale();
    this.$i18n.locale = this.savedLocale;
    await this.$store.direct.dispatch.oauth.loadAuthCodeToState();
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    if (this.authCode) {
      await this.$store.direct.dispatch.oauth.loadBlizzardBtag(this.authCode);
    }
  }
  private setThemeColors() {
    this.$vuetify.theme.themes[ this.isDarkTheme ? "dark" : "light"] =
      Object.assign({}, this.$vuetify.theme.themes[ this.isDarkTheme ? "dark" : "light"], this.themeColors)
  }

  private showSignInDialog = false;

  created(): void {
    const t = window.localStorage.getItem("theme");
    if (t && t.length > 0) {
      this.theme = t;
    }
    this.setThemeColors();
  }
}
</script>

<style lang="scss">
@import "./scss/main.scss";

.right-menu {
  top: 10px;
}

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
  top: 9px;
}

@font-face {
  font-family: "Friz Quadrata Std Bold";
  font-style: normal;
  font-weight: normal;
  src: local("Friz Quadrata Std Bold"),
    url("./assets/fonts/friz-quadrata-std-bold-587034a220f9f.woff")
      format("woff");

  * {
    font-family: "Friz Quadrata Std Bold" !important;
  }
}

@font-face {
  font-family: "Friz Quadrata Std Italic";
  font-style: normal;
  font-weight: normal;
  src: local("Friz Quadrata Std Italic"),
    url("./assets/fonts/friz-quadrata-std-italic-587033b2c95df.woff")
      format("woff");

  * {
    font-family: "Friz Quadrata Std Italic" !important;
  }
}

@font-face {
  font-family: "Friz Quadrata Std Medium";
  font-style: normal;
  font-weight: normal;
  src: local("Friz Quadrata Std Medium"),
    url("./assets/fonts/friz-quadrata-std-medium-5870338ec7ef8.woff")
      format("woff");

  * {
    font-family: "Friz Quadrata Std Medium" !important;
  }
}

@font-face {
  font-family: "Friz Quadrata Std Bold Italic";
  font-style: normal;
  font-weight: normal;
  src: local("Friz Quadrata Std Bold Italic"),
    url("./assets/fonts/friz-quadrata-std-bold-italic-587033d6d4298.woff")
      format("woff");

  * {
    font-family: "Friz Quadrata Std Bold Italic" !important;
  }
}

.theme--dark.v-badge .v-badge__badge::after {
  border-color: #ffffff !important;
}

.theme--light.v-badge .v-badge__badge::after {
  border-color: #36393f !important;
}

.v-toolbar__content {
  overflow: auto;
  top: -8px;
}
</style>
