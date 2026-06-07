<template>
  <v-app :class="getTheme">
    <v-navigation-drawer
      v-model="navigationDrawerOpen"
      temporary
      absolute
      transition="slide-x-transition"
    >
      <v-list density="compact">
        <v-list-item>
          <router-link :to="{ name: EMainRouteName.HOME }">
            <brand-logo :is-dark-theme="isDarkTheme.get()" />
          </router-link>
          <template v-slot:append>
            <v-icon class="ml-5" @click="setNavigationDrawerOpen(false)">{{ mdiClose }}</v-icon>
          </template>
        </v-list-item>
      </v-list>
      <v-divider />
      <v-list density="compact" nav>
        <v-list-item
          v-for="item in items"
          v-show="isNavItemVisible(item)"
          :key="item.title"
          link
          :to="{ name: item.to }"
        >
          <template v-slot:prepend>
            <v-icon size="x-large">{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>
            {{ $t(`views_app.${item.title}`) }}
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar :class="{ darkmode: isDarkTheme.get() }" class="pr-3">
      <!-- toggle button for drawer menu, only for lower than lg -->
      <v-app-bar-nav-icon class="d-lg-none" @click="setNavigationDrawerOpen(true)" />
      <v-toolbar-title class="ms-4">
        <router-link class="d-inline-flex w-auto" :to="{ name: EMainRouteName.HOME }">
          <brand-logo
            :is-dark-theme="isDarkTheme.get()"
            style="max-height: 30px"
            class="ml-2 d-none d-sm-flex"
          />
        </router-link>
      </v-toolbar-title>

      <!-- alternative menu for lg+ only -->
      <span class="d-none d-lg-flex">
        <v-btn
          v-for="item in items"
          v-show="isNavItemVisible(item)"
          :key="item.title"
          variant="text"
          tile
          :to="{ name: item.to }"
          :class="item.class"
        >
          <span class="mr-1">
            {{ $t(`views_app.${item.title}`) }}
          </span>
          <v-icon size="x-large">{{ item.icon }}</v-icon>
        </v-btn>
        <v-divider vertical />
      </span>

      <global-search />

      <v-btn v-if="!authCode" variant="text" tile @click="loginOrGoToProfile">
        <v-icon v-if="!authCode" size="x-large">{{ mdiAccountCircleOutline }}</v-icon>
        <sign-in-dialog :value="showSignInDialog" @toggle-dialog="toggleSignInDialog" />
      </v-btn>

      <v-menu v-if="authCode">
        <template v-slot:activator="{ props }">
          <v-btn variant="text" tile v-bind="props">
            <span class="d-none d-sm-flex mr-1">{{ loginName }}</span>
            <v-icon size="x-large">{{ mdiAccountCircle }}</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="openPlayerProfile">
            <template v-slot:prepend>
              <v-icon>{{ mdiAccountCircle }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("views_app.viewprofile") }}</v-list-item-title>
          </v-list-item>
          <v-list-item @click="logout">
            <template v-slot:prepend>
              <v-icon>{{ mdiLogout }}</v-icon>
            </template>
            <v-list-item-title>{{ $t("views_app.logout") }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn variant="text" tile :to="{ name: EMainRouteName.REWARDS }">
        <v-icon size="x-large">{{ mdiTreasureChest }}</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn variant="text" tile class="right-menu" v-bind="props">
            <v-icon size="x-large">{{ mdiInvertColors }}</v-icon>
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

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn variant="text" tile style="margin-top: 2px" v-bind="props">
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
    <v-footer class="pa-0 flex-0-0 w3-glass">
      <v-row justify="center" no-gutters>
        <v-btn variant="text" tile class="my-2" to="/imprint">Imprint</v-btn>
        <v-btn variant="text" tile class="my-2" :to="{ name: EMainRouteName.PRIVACY }">Privacy Policy</v-btn>
        <v-btn variant="text" tile class="my-2" :to="{ name: EMainRouteName.COOKIES }">Cookie Policy</v-btn>
        <v-btn variant="text" tile class="my-2" @click="openCookieSettings">Cookie settings</v-btn>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, defineComponent, computed, ref } from "vue";
import { getProfileUrl } from "./helpers/url-functions";
import SignInDialog from "@/components/common/SignInDialog.vue";
import BrandLogo from "@/components/common/BrandLogo.vue";
import GlobalSearch from "@/components/common/GlobalSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { useRootStateStore } from "@/store/rootState/store";
import { useRoute, useRouter } from "vue-router";
import languages from "@/locales/languages";
import { useI18n } from "vue-i18n";
import noop from "lodash/noop";
import { useTheme } from "vuetify";
import { battleTagToName } from "./helpers/profile";
import { EMainRouteName } from "@/router/types";
import { LOGIN_RETURN_TO_KEY, OPEN_SIGN_IN_DIALOG_EVENT } from "@/constants/sso";
import LocaleIcon from "@/components/common/LocaleIcon.vue";
import { openCookieSettings } from "@/analytics/analytics";

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
  mdiLogout,
  mdiTreasureChest,
  mdiTrophy,
  mdiViewList,
} from "@mdi/js";

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
    GlobalSearch,
    LocaleIcon,
  },
  setup() {
    const { locale } = useI18n();
    const router = useRouter();
    const route = useRoute();
    const oauthStore = useOauthStore();
    const rootStateStore = useRootStateStore();
    const savedLanguage = "en";
    const navigationDrawerOpen = ref(false);
    const theme = useTheme();

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
        to: EMainRouteName.TOURNAMENTS,
      },
      {
        title: "rankings",
        icon: mdiViewList,
        to: EMainRouteName.RANKINGS,
      },
      {
        title: "matches",
        icon: mdiControllerClassic,
        to: EMainRouteName.MATCHES,
      },
      {
        title: "statistics",
        icon: mdiChartAreaspline,
        to: EMainRouteName.OVERALL_STATISTICS,
      },
      {
        title: "admin",
        icon: mdiAccountTie,
        to: EMainRouteName.ADMIN,
      },
      {
        title: "faq",
        icon: mdiHelpCircleOutline,
        to: EMainRouteName.FAQ,
        class: "d-none d-md-flex",
      },
    ];

    function loginOrGoToProfile(): void {
      if (authCode.value) {
        openPlayerProfile();
      } else {
        clearLoginReturnTo();
        showSignInDialog.value = true;
      }
    }

    function openSignInDialog(returnTo?: string): void {
      if (returnTo) {
        window.sessionStorage.setItem(LOGIN_RETURN_TO_KEY, returnTo);
      }
      showSignInDialog.value = true;
    }

    function clearLoginReturnTo(): void {
      window.sessionStorage.removeItem(LOGIN_RETURN_TO_KEY);
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
      theme.change(val);
    }

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

    const toggleSignInDialog = (val: boolean) => {
      showSignInDialog.value = val;
    };

    const handleOpenSignInDialog = (event: Event): void => {
      const customEvent = event as CustomEvent<{ returnTo?: string }>;
      openSignInDialog(customEvent.detail?.returnTo ?? route.fullPath);
    };

    async function init() {
      rootStateStore.loadLocale();
      locale.value = savedLocale.get();
      oauthStore.loadAuthCodeToState();

      // Runs on every route, including /sso-continue. loadBlizzardBtag is now
      // status-aware (it only logs out on a definitive 401/403, never on a transient
      // 5xx/network), so this bootstrap no longer races SsoContinue's keep-cookie
      // intent: a transient error keeps the cookie, and an expired cookie is already
      // cleared synchronously by SsoContinue's onMounted (which runs before this
      // one), so loadAuthCodeToState reads empty there. Hydrating here means a valid
      // session is restored app-wide even when SsoContinue exits via a cookie-
      // preserving error path (invalid-return / transient "error").
      if (authCode.value) {
        await oauthStore.loadBlizzardBtag(authCode.value);
      }
    }

    onMounted(async () => {
      await init();
    });

    onBeforeUnmount(() => {
      window.removeEventListener(OPEN_SIGN_IN_DIALOG_EVENT, handleOpenSignInDialog);
    });

    onBeforeMount(() => {
      const t = window.localStorage.getItem("theme");
      if (t && t.length > 0) {
        setTheme(t);
      }
      // Register the sign-in dialog listener before any child component mounts.
      // Vue mounts children before parents, so if a child (e.g. SsoContinueView)
      // dispatches OPEN_SIGN_IN_DIALOG_EVENT from its own onMounted hook, it would
      // fire before App's onMounted and the event would be dropped. onBeforeMount
      // runs before the component's subtree is mounted, guaranteeing the listener
      // is in place when any child dispatches the event.
      window.addEventListener(OPEN_SIGN_IN_DIALOG_EVENT, handleOpenSignInDialog);
    });

    return {
      mdiClose,
      mdiAccountCircleOutline,
      mdiAccountCircle,
      mdiCog,
      mdiInvertColors,
      mdiLogout,
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
      openSignInDialog,
      clearLoginReturnTo,
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
      openCookieSettings,
      EMainRouteName,
      toggleSignInDialog,
    };
  },
});
</script>
