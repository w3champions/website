<template>
  <v-app class="w3app" :class="getTheme" :dark="isDarkTheme.get()">
    <v-navigation-drawer
      v-model="navigationDrawerOpen"
      temporary
      absolute
      transition="slide-x-transition"
    >
      <v-list dense>
        <v-list-item>
          <v-list-item-content>
            <router-link :to="{ name: 'Home' }">
              <brand-logo :is-dark-theme="isDarkTheme.get()" />
            </router-link>
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon class="ml-5" @click="setNavigationDrawerOpen(false)">{{ mdiClose }}</v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list dense nav>
        <v-list-item
          v-for="item in items"
          v-show="isNavItemVisible(item)"
          :key="item.title"
          link
          :to="{ name: item.to }"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t(`views_app.${item.title}`) }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar :class="{ darkmode: isDarkTheme.get() }" :dark="isDarkTheme.get()" app>
      <!-- toggle button for drawer menu, only for lower than lg -->
      <v-app-bar-nav-icon class="d-lg-none" @click="setNavigationDrawerOpen(true)" />
      <v-toolbar-title class="pa-0">
        <router-link :to="{ name: 'Home' }">
          <brand-logo
            :is-dark-theme="isDarkTheme.get()"
            style="max-height: 30px"
            class="ml-2 d-none d-sm-flex"
          />
        </router-link>
      </v-toolbar-title>
      <v-spacer />

      <!-- alternative menu for lg+ only -->
      <span class="d-none d-lg-flex">
        <v-btn
          v-for="item in items"
          v-show="isNavItemVisible(item)"
          :key="item.title"
          text
          tile
          :to="{ name: item.to }"
          :class="item.class"
        >
          <span class="mr-2">
            {{ $t(`views_app.${item.title}`) }}
          </span>
          <v-icon>{{ item.icon }}</v-icon>
        </v-btn>
        <v-divider vertical />
      </span>

      <global-search />

      <v-btn v-if="!authCode" text tile @click="loginOrGoToProfile">
        <v-icon v-if="!authCode" class="mr-2">{{ mdiAccountCircleOutline }}</v-icon>
        <sign-in-dialog v-model="showSignInDialog" />
      </v-btn>

      <v-menu v-if="authCode">
        <template v-slot:activator="{ on }">
          <v-btn text tile v-on="on">
            <span class="d-none d-sm-flex mr-2">{{ loginName }}</span>
            <v-icon>{{ mdiAccountCircle }}</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="openPlayerProfile">
            <v-list-item-title>{{ $t("views_app.viewprofile") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <v-list-item-title>{{ $t("views_app.logout") }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn text tile :to="{ name: 'Rewards' }">
        <v-icon>{{ mdiTreasureChest }}</v-icon>
      </v-btn>

      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn text tile class="right-menu" v-on="on">
            <v-icon>{{ mdiInvertColors }}</v-icon>
          </v-btn>
        </template>
        <v-list max-height="400" class="theme-selector overflow-y-auto">
          <v-list-item @click="setTheme('human')">
            <v-list-item-title>{{ $t("races.HUMAN") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="setTheme('orc')">
            <v-list-item-title>{{ $t("races.ORC") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="setTheme('nightelf')">
            <v-list-item-title>{{ $t("races.NIGHT_ELF") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="setTheme('undead')">
            <v-list-item-title>{{ $t("races.UNDEAD") }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn text tile style="margin-top: 2px" v-on="on">
            <locale-icon :locale="savedLocale.get()" :showTwoLetterCode="false" />
          </v-btn>
        </template>
        <v-list class="locale-selector">
          <v-list-item
            v-for="lang in activeLanguages.get()"
            :key="lang"
            @click="savedLocale.set(lang)"
          >
            <locale-icon :locale="lang" />
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
import { onBeforeMount, onMounted, defineComponent, computed, ref } from "vue";
import { getProfileUrl } from "./helpers/url-functions";
import SignInDialog from "@/components/common/SignInDialog.vue";
import localeIcon from "@/components/common/LocaleIcon.vue";
import BrandLogo from "@/components/common/BrandLogo.vue";
import GlobalSearch from "@/components/common/GlobalSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { useRootStateStore } from "@/store/rootState/store";
import { useRouter } from "vue-router/composables";
import languages from "@/locales/languages";
import { useVuetify } from "@/plugins/vuetify";
import { useI18n } from "vue-i18n-bridge";
import noop from "lodash/noop";

import {
  mdiAccountCircle,
  mdiAccountCircleOutline,
  mdiAccountTie,
  mdiChartAreaspline,
  mdiClose,
  mdiCog,
  mdiControllerClassic,
  mdiHelpCircleOutline,
  mdiInvertColors,
  mdiTreasureChest,
  mdiTrophy,
  mdiViewList,
} from "@mdi/js";
import { battleTagToName } from "./helpers/profile";

export type ItemType = {
  title: string;
  icon: string;
  to: string;
  class?: string;
};

export default defineComponent({
  name: "App",
  components: {
    BrandLogo,
    SignInDialog,
    localeIcon,
    GlobalSearch,
  },
  setup() {
    const { locale } = useI18n();
    const router = useRouter();
    const vuetify = useVuetify();
    const oauthStore = useOauthStore();
    const rootStateStore = useRootStateStore();
    const savedLanguage = "en";
    const navigationDrawerOpen = ref(false);

    const showSignInDialog = ref(false);
    const selectedTheme = ref("human");

    const authCode = computed(() => {
      return oauthStore.token;
    });

    const getTheme = computed(() => {
      return selectedTheme.value;
    });

    const items: ItemType[] = [
      {
        title: "tournaments",
        icon: mdiTrophy,
        to: "Tournaments",
      },
      {
        title: "rankings",
        icon: mdiViewList,
        to: "Rankings",
      },
      {
        title: "matches",
        icon: mdiControllerClassic,
        to: "Matches",
      },
      {
        title: "statistics",
        icon: mdiChartAreaspline,
        to: "OverallStatistics",
      },
      {
        title: "admin",
        icon: mdiAccountTie,
        to: "Admin",
      },
      {
        title: "faq",
        icon: mdiHelpCircleOutline,
        to: "FAQ",
        class: "d-none d-md-flex",
      },
    ];

    function loginOrGoToProfile(): void {
      if (authCode.value) {
        openPlayerProfile();
      } else {
        showSignInDialog.value = true;
      }
    }

    function setNavigationDrawerOpen(val: boolean): void {
      navigationDrawerOpen.value = val;
    }

    function logout(): void {
      oauthStore.logout();
    }

    const loginName = computed({
      get: () => battleTagToName(oauthStore.blizzardVerifiedBtag),
      set: noop,
    });

    const battleTag = computed({
      get() {
        return oauthStore.blizzardVerifiedBtag;
      },
      set: noop,
    });

    const isAdmin = ({
      get: () => oauthStore.isAdmin,
    });

    function openPlayerProfile(): void {
      router.push({
        path: getProfileUrl(battleTag.value),
      });
    }

    const savedLocale = ({
      get: () => rootStateStore.locale,
      set: (newVal: string) => {
        locale.value = newVal;
        rootStateStore.saveLocale(newVal);
      }
    });

    const activeLanguages = ({
      get: () => Object.keys(languages),
    });

    function setTheme(val: string) {
      window.localStorage.setItem("theme", val);
      selectedTheme.value = val;
      vuetify.theme.dark = isDarkTheme.get();
      setThemeColors();
      rootStateStore.SET_DARK_MODE(isDarkTheme.get());
    }

    const themeColors = ({
      get: () => {
        switch (getTheme.value) {
          case "nightelf":
            return {
              primary: "#ffd428",
              "w3-race-bg": "#0d0718",
            };
          case "undead":
            return {
              primary: "#ffd428",
              "w3-race-bg": "#000",
            };
          case "orc":
            return {
              primary: "#5c2604",
              "w3-race-bg": "#c7baa1",
            };
          default:
            return {
              primary: "#1976d2",
              "w3-race-bg": "#e9e9e9",
            };
        }
      },
    });

    const isDarkTheme = ({
      get: () => {
        const isDark = getTheme.value === "nightelf" || getTheme.value === "undead";
        return isDark;
      },
    });

    // Check if given ItemType element is visible for the current user
    function isNavItemVisible(item: ItemType): boolean {
      if (item.title == "admin" && !isAdmin.get()) {
        return false;
      }
      return true;
    }

    function setThemeColors() {
      vuetify.theme.themes[isDarkTheme.get() ? "dark" : "light"] =
      Object.assign(
        {},
        vuetify.theme.themes[isDarkTheme.get() ? "dark" : "light"],
        themeColors.get()
      );
    }

    async function init() {
      rootStateStore.loadLocale();
      locale.value = savedLocale.get();
      await oauthStore.loadAuthCodeToState();

      if (authCode.value) {
        await oauthStore.loadBlizzardBtag(authCode.value);
      }
    }

    onMounted(async () => {
      await init();
    });

    onBeforeMount(() => {
      const t = window.localStorage.getItem("theme");
      if (t && t.length > 0) {
        setTheme(t);
      }
      setThemeColors();
    });

    return {
      mdiClose,
      mdiAccountCircleOutline,
      mdiAccountCircle,
      mdiCog,
      mdiInvertColors,
      mdiTreasureChest,
      oauthStore,
      savedLanguage,
      setNavigationDrawerOpen,
      navigationDrawerOpen,
      items,
      showSignInDialog,
      rootStateStore,
      authCode,
      loginOrGoToProfile,
      logout,
      loginName,
      battleTag,
      isAdmin,
      openPlayerProfile,
      savedLocale,
      isNavItemVisible,
      isDarkTheme,
      init,
      activeLanguages,
      getTheme,
      setTheme,
    };
  },
});
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
  top: 9px;
}

.theme--dark.v-badge .v-badge__badge::after {
  border-color: #ffffff !important;
}

.theme--light.v-badge .v-badge__badge::after {
  border-color: #36393f !important;
}
</style>
