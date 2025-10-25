<template>
  <v-navigation-drawer permanent>
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>
          {{ $t("views_admin.adminpage") }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list dense nav>
      <template v-for="(item, index) in filteredNavItems">
        <v-list-item
          v-if="!item.items || item.items.length === 0"
          :key="index"
          :to="{ name: item.routeName }"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon || mdiAccountTie }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-group
          v-if="item.items && item.items.length > 0"
          :key="index"
          :value="false"
          :prepend-icon="item.icon"
          no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </template>

          <v-list-item
            v-for="(subItem, i) in item.items"
            :key="i"
            class="ml-0 pl-6"
            :to="{ name: subItem.routeName }"
          >
            <v-list-item-icon>
              <v-icon>{{ subItem.icon || mdiAccountTie }}</v-icon>
            </v-list-item-icon>

            <v-list-item-title>{{ subItem.title }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, watch } from "vue";
import { AdminNavigationItem } from "@/store/admin/types";
import { mdiAccountSearch, mdiAccountTie, mdiFileLinkOutline } from "@mdi/js";
import { EPermission } from "@/store/admin/permission/types";
import { useOauthStore } from "@/store/oauth/store";
import { useRouter, useRoute } from "vue-router/composables";
import { EAdminRouteName } from "@/router/types";
import {
  mdiAccountBoxOutline, mdiAccountGroup, mdiAccountNetwork, mdiAccountQuestion,
  mdiAccountRemove, mdiBriefcase, mdiChartLine, mdiChatRemove, mdiChatRemoveOutline,
  mdiCog, mdiFormatAlignLeft, mdiGift, mdiMapPlus, mdiMapSearch, mdiMessageAlert,
  mdiMonitorDashboard, mdiRocket, mdiRss, mdiSwordCross, mdiTable, mdiTooltipTextOutline,
  mdiAccountKey, mdiFileDocumentOutline, mdiFileDocument, mdiTrophy, mdiLink,
  mdiAccountMultiple, mdiRadar, mdiAccountHeart, mdiApi, mdiTranslate
} from "@mdi/js";

export default defineComponent({
  name: "AdminNavigation",
  components: {},
  setup() {
    const router = useRouter();
    const route = useRoute();
    const oauthStore = useOauthStore();

    const permissions = computed<string[]>(() => oauthStore.permissions);
    const filteredNavItems = computed<AdminNavigationItem[]>(() => {
      return navItems
        .map((item) => ({
          ...item,
          items: item.items
            ? item.items.filter((subItem) =>
                permissions.value.includes(EPermission[subItem.permission])
              )
            : [],
        }))
        .filter(
          (item) =>
            item.items.length > 0 ||
            permissions.value.includes(EPermission[item.permission])
        );
    });

    function getFirstItem(items: Array<AdminNavigationItem>): AdminNavigationItem {
      for (const item of items) {
        if (!item.items) {
          return item;
        }
        const subItem = getFirstItem(item.items);
        if (subItem) {
          return subItem;
        }
      }
      return items[0];
    }

    onMounted((): void => {
      init();
    });

    function init() {
      if (permissions.value.length === 0) return;
      const lastPathFragment = route.path.split("/").pop();

      // Route to the first available page if the user navigated to the admin panel.
      if (lastPathFragment === "admin") {
        const firstItem = getFirstItem(filteredNavItems.value);
        router.push(`admin/${firstItem.component}`);
      }
    }

    watch(permissions, init);

    const navItems: Array<AdminNavigationItem> = [
      {
        title: "Data Science",
        icon: mdiChartLine,
        permission: EPermission.Queue,
        items: [
          {
            title: "Live Queue Data",
            icon: mdiTable,
            permission: EPermission.Queue,
            component: "admin-queue-data",
            routeName: EAdminRouteName.LIVE_QUEUE_DATA,
          },
        ],
      },
      {
        title: "Moderation",
        icon: mdiAccountGroup,
        permission: EPermission.Moderation,
        items: [
          {
            title: "Banned Players",
            icon: mdiAccountRemove,
            permission: EPermission.Moderation,
            component: "admin-banned-players",
            routeName: EAdminRouteName.BANNED_PLAYERS,
          },
          {
            title: "Ban Reason Translations",
            icon: mdiTranslate,
            permission: EPermission.Moderation,
            component: "admin-ban-reason-translations",
            routeName: EAdminRouteName.BAN_REASON_TRANSLATIONS,
          },
          {
            title: "Global Mute",
            icon: mdiChatRemove,
            permission: EPermission.Moderation,
            component: "admin-global-mute",
            routeName: EAdminRouteName.GLOBAL_MUTE,
          },
          {
            title: "Lounge Mute",
            icon: mdiChatRemoveOutline,
            permission: EPermission.Moderation,
            component: "admin-lounge-mute",
            routeName: EAdminRouteName.LOUNGE_MUTE,
          },
          {
            title: "View Game Chat",
            icon: mdiFormatAlignLeft,
            permission: EPermission.Moderation,
            component: "admin-view-game-chat",
            routeName: EAdminRouteName.VIEW_GAME_CHAT,
          },
        ],
      },
      {
        title: "Smurf Checker",
        icon: mdiAccountQuestion,
        permission: EPermission.SmurfCheckerQuery,
        items: [
          {
            title: "Search Smurfs",
            icon: mdiAccountSearch,
            permission: EPermission.SmurfCheckerQuery,
            component: "admin-smurfs",
            routeName: EAdminRouteName.SMURF_CHECKER_QUERY,
          },
          {
            title: "Manage Identifiers",
            icon: mdiFileLinkOutline,
            permission: EPermission.SmurfCheckerAdministration,
            component: "admin-smurfs-manage-identifiers",
            routeName: EAdminRouteName.SMURF_CHECKER_MANAGE_IDENTIFIERS,
          },
        ],
      },
      {
        title: "Player Settings",
        icon: mdiCog,
        permission: EPermission.Proxies,
        items: [
          {
            title: "Proxy Settings",
            icon: mdiAccountNetwork,
            permission: EPermission.Proxies,
            component: "admin-proxies",
            routeName: EAdminRouteName.PROXY_SETTINGS,
          },
        ],
      },
      {
        title: "Launcher",
        icon: mdiRocket,
        permission: EPermission.Content,
        items: [
          {
            title: "News",
            icon: mdiRss,
            permission: EPermission.Content,
            component: "admin-news-for-launcher",
            routeName: EAdminRouteName.NEWS,
          },
        ],
      },
      {
        title: "In-Game Settings",
        icon: mdiMonitorDashboard,
        permission: EPermission.Content,
        items: [
          {
            title: "Loading Screen Tips",
            icon: mdiTooltipTextOutline,
            permission: EPermission.Content,
            component: "admin-loading-screen-tips",
            routeName: EAdminRouteName.LOADING_SCREEN_TIPS,
          },
          {
            title: "Message Of The Day",
            icon: mdiMessageAlert,
            permission: EPermission.Content,
            component: "admin-motd",
            routeName: EAdminRouteName.MESSAGE_OF_THE_DAY,
          },
        ],
      },
      {
        title: "Rewards",
        icon: mdiGift,
        permission: EPermission.Content,
        items: [
          {
            title: "Manage Rewards",
            icon: mdiTrophy,
            permission: EPermission.Content,
            component: "admin-rewards",
            routeName: EAdminRouteName.MANAGE_REWARDS,
          },
          {
            title: "Product Mappings",
            icon: mdiLink,
            permission: EPermission.Content,
            component: "admin-product-mappings",
            routeName: EAdminRouteName.PRODUCT_MAPPINGS,
          },
          {
            title: "Reward Assignments",
            icon: mdiAccountMultiple,
            permission: EPermission.Content,
            component: "admin-assignments",
            routeName: EAdminRouteName.REWARD_ASSIGNMENTS,
          },
          {
            title: "Patreon Links",
            icon: mdiAccountHeart,
            permission: EPermission.Content,
            component: "admin-patreon-links",
            routeName: EAdminRouteName.PATREON_LINKS,
          },
          {
            title: "Drift Detection",
            icon: mdiRadar,
            permission: EPermission.Content,
            component: "admin-drift-detection",
            routeName: EAdminRouteName.DRIFT_DETECTION,
          },
          {
            title: "Assign Portraits",
            icon: mdiAccountBoxOutline,
            permission: EPermission.Content,
            component: "admin-assign-portraits",
            routeName: EAdminRouteName.ASSIGN_PORTRAITS,
          },
          {
            title: "Manage Portraits",
            icon: mdiBriefcase,
            permission: EPermission.Content,
            component: "admin-manage-portraits",
            routeName: EAdminRouteName.MANAGE_PORTRAITS,
          },
          {
            title: "Manage Alibaba Files",
            icon: mdiFileDocumentOutline,
            permission: EPermission.Content,
            component: "admin-storage-alibaba",
            routeName: EAdminRouteName.MANAGE_ALIBABA_FILES,
          },
          {
            title: "Manage S3 Files",
            icon: mdiFileDocument,
            permission: EPermission.Content,
            component: "admin-storage-s3",
            routeName: EAdminRouteName.MANAGE_S3_FILES,
          },
        ],
      },
      {
        title: "Maps",
        icon: mdiMapSearch,
        permission: EPermission.Maps,
        items: [
          {
            title: "Manage Maps",
            icon: mdiMapPlus,
            permission: EPermission.Maps,
            component: "admin-maps",
            routeName: EAdminRouteName.MANAGE_MAPS,
          },
        ],
      },
      {
        title: "Tournaments",
        icon: mdiSwordCross,
        permission: EPermission.Tournaments,
        items: [
          {
            title: "Manage Tournaments",
            icon: mdiSwordCross,
            permission: EPermission.Tournaments,
            component: "admin-tournaments",
            routeName: EAdminRouteName.MANAGE_TOURNAMENTS,
          },
        ],
      },
      {
        title: "Permissions",
        icon: mdiAccountKey,
        permission: EPermission.Permissions,
        items: [
          {
            title: "Manage Permissions",
            icon: mdiAccountKey,
            permission: EPermission.Permissions,
            component: "admin-permissions",
            routeName: EAdminRouteName.MANAGE_PERMISSIONS,
          },
          {
            title: "API Tokens",
            icon: mdiApi,
            permission: EPermission.Permissions,
            component: "admin-api-tokens",
            routeName: EAdminRouteName.MANAGE_API_TOKENS,
          },
        ],
      },
      {
        title: "Server Logs",
        icon: mdiFileDocumentOutline,
        permission: EPermission.Logs,
        items: [
          {
            title: "View Server Logs",
            icon: mdiFileDocumentOutline,
            permission: EPermission.Logs,
            component: "admin-server-logs",
            routeName: EAdminRouteName.VIEW_SERVER_LOGS,
          },
        ],
      },
    ];

    return {
      mdiAccountTie,
      filteredNavItems,
    };
  },
});
</script>
