<template>
  <v-app class="w3app">
    <v-navigation-drawer
      temporary
      absolute
      transition="slide-x-transition"
      v-model="isNavigationDrawerOpen"
    >
      <v-list dense>
        <v-list-item prepend-icon="mdi-close">
          <router-link :to="{ name: 'Home' }">
            <brand-logo :is-dark-theme="isDarkTheme.get()" />
          </router-link>
          <!-- <v-icon class="ml-5" @click="isNavigationDrawerOpen = false">{{ mdiClose }}</v-icon> -->
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list dense nav>
        <v-list-item
          v-for="item in items"
          :key="item.title"
          v-show="isNavItemVisible(item)"
          :prepend-icon="item.icon"
          link
          :to="{ name: item.to }"
        >
          <v-list-item-title>
            {{ $t(`views_app.${item.title}`) }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar :class="{ darkmode: isDarkTheme }" :dark="isDarkTheme" app>
      <!-- toggle button for drawer menu, only for lower than lg -->
     <v-app-bar-nav-icon
       @click.stop="isNavigationDrawerOpen = true"
       class="d-lg-none"
     ></v-app-bar-nav-icon>
      <v-toolbar-title class="pa-0">
        <router-link :to="{ name: 'Home' }">
          <brand-logo
            :is-dark-theme="isDarkTheme.get()"
            style="max-height: 30px"
            class="ml-2 d-none d-sm-flex"
          />
        </router-link>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- alternative menu for lg+ only -->
      <span class="d-none d-lg-flex">
        <v-btn
          v-for="item in items"
          v-show="isNavItemVisible(item)"
          :key="item.title"
          tile
          :to="{ name: item.to }"
          :class="item.class"
        >
          <span class="mr-2">
            {{ $t(`views_app.${item.title}`) }}
          </span>
          <v-icon size="x-large" :icon="item.icon" />
        </v-btn>
        <v-divider vertical />
      </span>

      <global-search />

      <v-btn tile @click="loginOrGoToProfile" v-if="!authCode">
        <v-icon v-if="!authCode" class="mr-2" icon="mdi-account-circle-outline" size="x-large" />
        <sign-in-dialog
          v-model="showSignInDialog"
          @region-change="saveLoginRegion"
        ></sign-in-dialog>
      </v-btn>

      <v-menu v-if="authCode">
        <template #activator="{ props }">
          <v-btn tile v-bind="props">
            <span class="d-none d-sm-flex mr-2">{{ loginName }}</span>
            <v-icon size="x-large">mdi-account-circle</v-icon>
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

      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn tile v-bind="props" class="right-menu">
            <v-icon size="x-large">mdi-invert-colors</v-icon>
          </v-btn>
        </template>
        <v-list class="theme-selector">
          <v-list-item @click="currentTheme = 'human'">
            <v-list-item-title>{{ $t("races.HUMAN") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="currentTheme = 'orc'">
            <v-list-item-title>{{ $t("races.ORC") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="currentTheme = 'nightelf'">
            <v-list-item-title>{{ $t("races.NIGHT_ELF") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="currentTheme = 'undead'">
            <v-list-item-title>{{ $t("races.UNDEAD") }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-menu>
        <template #activator="{ props }">
          <v-btn tile v-bind="props" style="margin-top: 2px">
            <locale-icon
              :locale="savedLocale.get()"
              :showTwoLetterCode="false"
            ></locale-icon>
          </v-btn>
        </template>
        <v-list class="locale-selector">
          <v-list-item
            v-for="lang in languages.get()"
            :key="lang"
            @click="savedLocale.set(lang)"
          >
            <locale-icon :locale="lang"></locale-icon>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
    <v-footer padless class>
      <v-row justify="center" no-gutters>
        <v-btn tile class="my-2" to="/imprint">Imprint</v-btn>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
// import { Component, Vue } from "vue-facing-decorator";
import { getProfileUrl } from "./helpers/url-functions";
import SignInDialog from "@/components/common/SignInDialog.vue";
import { BnetOAuthRegion } from "./store/oauth/types";
import localeIcon from "@/components/common/LocaleIcon.vue";
import BrandLogo from "@/components/common/BrandLogo.vue";
import GlobalSearch from "@/components/common/GlobalSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { useRootStateStore } from "@/store/rootState/store";
import { i18n, locale } from "./plugins/i18n";
import { useTheme } from 'vuetify';
import { useRoute, useRouter } from 'vue-router';

export type ItemType = {
  title: string;
  icon: string;
  to: string;
  class?: string;
};

import { defineComponent, computed, ComputedRef, ref } from 'vue';
import { onMounted } from "vue";

export default defineComponent({
  name: "App",
  components: {
    BrandLogo,
    SignInDialog,
    localeIcon,
    GlobalSearch,
  },
  setup(props, context) {
    const router = useRouter();
    const route = useRoute();
    const oauthStore = useOauthStore();
    const _savedLocale = "en";
    const isNavigationDrawerOpen = false;
    const items: ItemType[] = [
    {
      title: "tournaments",
      icon: "mdi-trophy",
      to: "Tournaments",
    },
    {
      title: "rankings",
      icon: "mdi-view-list",
      to: "Rankings",
    },
    {
      title: "matches",
      icon: "mdi-controller-classic",
      to: "Matches",
    },
    {
      title: "statistics",
      icon: "mdi-chart-areaspline",
      to: "OverallStatistics",
    },
    {
      title: "admin",
      icon: "mdi-account-tie",
      to: "Admin",
    },
    {
      title: "faq",
      icon: "mdi-help-circle-outline",
      to: "FAQ",
      class: "d-none d-md-flex",
    },
  ];
  let showSignInDialog = false;
  const rootStateStore = useRootStateStore();
  const theme = useTheme();

  const currentTheme = computed({
    get: () => theme.global.name.value,
    set: (newValue: string) => {
      console.log(newValue);
      theme.global.name.value = newValue;
    }
  });

  const authCode = oauthStore.token;

  // const authCode = computed({
  //   get: () => oauthStore.token,
  //   set: () => {},
  // })

  function loginOrGoToProfile(): void {
    if (authCode) {
      openPlayerProfile();
    } else {
      showSignInDialog = true;
    }
  }

  function logout(): void {
    oauthStore.logout();
  }

  const loginName = computed({
    get: () => oauthStore.blizzardVerifiedBtag?.split("#")[0],
    set: () => {},
  })

  const battleTag = ({
    get: () => oauthStore.blizzardVerifiedBtag,
    set: () => {},
  })

  const isAdmin = ({
    get: () => oauthStore.isAdmin,
    set: () => {},
  })

  function openPlayerProfile(): void {
    router.push({
      path: getProfileUrl(battleTag.get()),
    });
  }

  const savedLocale = ({
    get: () => rootStateStore.locale,
    set: (newVal: string) => {
      rootStateStore.saveLocale(newVal);
    }
  })

  const languages = ({
    get: () => ["en", "fr"],
    set: () => {},
  })

  // Check if given ItemType element is visible for the current user
  function isNavItemVisible(item: ItemType): boolean {
    if (item.title == "admin" && !isAdmin) {
        return false;
      }
      return true;
  }
  async function saveLoginRegion({ region, done }: { region: BnetOAuthRegion; done: () => void }) {
    await oauthStore.saveLoginRegion(region);
    done();
  }

  const isDarkTheme = ({
    get: () => theme.current.value.dark,
    set: () => {}
  })

  onMounted(async () => {
    await init();
  })

  async function init() {
    rootStateStore.loadLocale();
    // i18n.locale = savedLocale;
    await oauthStore.loadAuthCodeToState();
    if (authCode) {
      await oauthStore.loadBlizzardBtag(authCode);
    }
  }

  // created(): void {
  //   const t = window.localStorage.getItem("theme");
  //   if (t && t.length > 0) {
  //     // this.theme = t;
  //   }
  //   // this.setThemeColors();
  // }

    return {
      oauthStore,
      _savedLocale,
      isNavigationDrawerOpen,
      items,
      showSignInDialog,
      rootStateStore,
      theme,
      currentTheme,
      authCode,
      loginOrGoToProfile,
      logout,
      loginName,
      battleTag,
      isAdmin,
      openPlayerProfile,
      savedLocale,
      languages,
      isNavItemVisible,
      saveLoginRegion,
      isDarkTheme,
      init,
    }
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
