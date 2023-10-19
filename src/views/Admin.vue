<template>
  <v-container fluid v-show="isAdmin" style="height: 100%">
    <admin-check-jwt-lifetime />
    <div class="admin-page-wrapper">
      <admin-navigation :items="filteredNavItems" @itemSelected="navItemSelected"></admin-navigation>
      <v-card tile>
        <v-card-title>
          {{ selectedNavItem.title }}
        </v-card-title>
        <component v-bind:is="selectedNavItem.component"></component>
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { NavigationItem } from "@/store/admin/types";

import AdminNavigation from "@/components/admin/AdminNavigation.vue";
import AdminBannedPlayers from "@/components/admin/AdminBannedPlayers.vue";
import AdminLoadingScreenTips from "@/components/admin/AdminLoadingScreenTips.vue";
import AdminNewsForLauncher from "@/components/admin/AdminNewsForLauncher.vue";
import AdminQueueData from "@/components/admin/AdminQueueData.vue";
import AdminProxies from "@/components/admin/AdminProxies.vue";
import AdminAlts from "@/components/admin/AdminAlts.vue";
import AdminGlobalMute from "@/components/admin/AdminGlobalMute.vue";
import AdminLoungeMute from "@/components/admin/AdminLoungeMute.vue";
import AdminAssignPortraits from "@/components/admin/AdminAssignPortraits.vue";
import AdminManagePortraits from "@/components/admin/AdminManagePortraits.vue";
import AdminMaps from "@/components/admin/AdminMaps.vue";
import AdminMotd from "@/components/admin/AdminMotd.vue";
import AdminTournaments from "@/components/admin/AdminTournaments.vue";
import AdminViewGameChat from "@/components/admin/AdminViewGameChat.vue";
import AdminCheckJwtLifetime from "@/components/admin/AdminCheckJwtLifetime.vue";
import AdminPermissions from "@/components/admin/AdminPermissions.vue";
import AdminServerLogs from "@/components/admin/AdminServerLogs.vue";
import { useOauthStore } from "@/store/oauth/store";
import {
  mdiAccountBoxOutline, mdiAccountGroup, mdiAccountNetwork, mdiAccountQuestion,
  mdiAccountRemove, mdiBriefcase, mdiChartLine, mdiChatRemove, mdiChatRemoveOutline,
  mdiCog, mdiFormatAlignLeft, mdiGift, mdiMapPlus, mdiMapSearch, mdiMessageAlert,
  mdiMonitorDashboard, mdiRocket, mdiRss, mdiSwordCross, mdiTable, mdiTooltipTextOutline,
  mdiAccountKey, mdiFileDocumentOutline
} from "@mdi/js";
import { EPermission } from "@/store/admin/permission/types";

@Component({
  components: {
    AdminNavigation,
    AdminBannedPlayers,
    AdminLoadingScreenTips,
    AdminNewsForLauncher,
    AdminQueueData,
    AdminProxies,
    AdminAlts,
    AdminGlobalMute,
    AdminLoungeMute,
    AdminAssignPortraits,
    AdminManagePortraits,
    AdminMaps,
    AdminMotd,
    AdminTournaments,
    AdminViewGameChat,
    AdminCheckJwtLifetime,
    AdminPermissions,
    AdminServerLogs,
  },
})
export default class Admin extends Vue {
  private oauthStore = useOauthStore();

  navItems: Array<NavigationItem> = [
    {
      title: "Data Science",
      icon: mdiChartLine,
      permission: EPermission.Queue,
      items: [
        {
          key: "queue",
          title: "Live Queue Data",
          icon: mdiTable,
          permission: EPermission.Queue,
          component: "admin-queue-data",
        },
      ],
    },
    {
      title: "Moderation",
      icon: mdiAccountGroup,
      permission: EPermission.Moderation,
      items: [
        {
          key: "banned_players",
          title: "Banned Players",
          icon: mdiAccountRemove,
          permission: EPermission.Moderation,
          component: "admin-banned-players",
        },
        {
          key: "alts",
          title: "Smurf Checker",
          icon: mdiAccountQuestion,
          permission: EPermission.Moderation,
          component: "admin-alts",
        },
        {
          key: "mute",
          title: "Global Mute",
          icon: mdiChatRemove,
          permission: EPermission.Moderation,
          component: "admin-global-mute",
        },
        {
          key: "lounge_mute",
          title: "Lounge Mute",
          icon: mdiChatRemoveOutline,
          permission: EPermission.Moderation,
          component: "admin-lounge-mute",
        },
        {
          key: "view_game_chat",
          title: "View Game Chat",
          icon: mdiFormatAlignLeft,
          permission: EPermission.Moderation,
          component: "admin-view-game-chat",
        },
      ],
    },
    {
      title: "Player Settings",
      icon: mdiCog,
      permission: EPermission.Proxies,
      items: [
        {
          key: "proxy_settings",
          title: "Proxy Settings",
          icon: mdiAccountNetwork,
          permission: EPermission.Proxies,
          component: "admin-proxies",
        },
      ],
    },
    {
      title: "Launcher",
      icon: mdiRocket,
      permission: EPermission.Content,
      items: [
        {
          key: "news",
          title: "News",
          icon: mdiRss,
          permission: EPermission.Content,
          component: "admin-news-for-launcher",
        },
      ],
    },
    {
      title: "In-Game Settings",
      icon: mdiMonitorDashboard,
      permission: EPermission.Content,
      items: [
        {
          key: "tips",
          title: "Loading screen tips",
          icon: mdiTooltipTextOutline,
          permission: EPermission.Content,
          component: "admin-loading-screen-tips",
        },
        {
          key: "motd",
          title: "Message of the Day",
          icon: mdiMessageAlert,
          permission: EPermission.Content,
          component: "admin-motd",
        },
      ],
    },
    {
      title: "Rewards",
      icon: mdiGift,
      permission: EPermission.Content,
      items: [
        {
          key: "portraits",
          title: "Assign Portraits",
          icon: mdiAccountBoxOutline,
          permission: EPermission.Content,
          component: "admin-assign-portraits",
        },
        {
          key: "manage-portraits",
          title: "Manage Portraits",
          icon: mdiBriefcase,
          permission: EPermission.Content,
          component: "admin-manage-portraits",
        },
      ],
    },
    {
      title: "Maps",
      icon: mdiMapSearch,
      permission: EPermission.Maps,
      items: [
        {
          key: "maps",
          title: "Manage Maps",
          icon: mdiMapPlus,
          permission: EPermission.Maps,
          component: "admin-maps",
        },
      ],
    },
    {
      title: "Tournaments",
      icon: mdiSwordCross,
      permission: EPermission.Tournaments,
      items: [
        {
          key: "tournaments",
          title: "Manage Tournaments",
          icon: mdiSwordCross,
          permission: EPermission.Tournaments,
          component: "admin-tournaments",
        },
      ],
    },
    {
      title: "Permissions",
      icon: mdiAccountKey,
      permission: EPermission.Permissions,
      items: [
        {
          key: "user_management",
          title: "Manage Permissions",
          icon: mdiAccountKey,
          permission: EPermission.Permissions,
          component: "admin-permissions",
        },
      ],
    },
    {
      title: "Server Logs",
      icon: mdiFileDocumentOutline,
      permission: EPermission.Logs,
      items: [
        {
          key: "admin-server-logs",
          title: "View Server Logs",
          icon: mdiFileDocumentOutline,
          permission: EPermission.Logs,
          component: "admin-server-logs",
        },
      ],
    },
  ];
  selectedNavItem = {} as NavigationItem;

  get filteredNavItems(): NavigationItem[] {
    return this.navItems.filter((item) => this.permissions.includes(EPermission[item.permission]));
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
  }

  get permissions(): string[] {
    return this.oauthStore.permissions;
  }

  navItemSelected(item: NavigationItem): void {
    this.selectedNavItem = item;
  }

  getFirstItem(items: Array<NavigationItem>): NavigationItem {
    for (const item of items) {
      if (!item.items) {
        return item;
      }
      const subItem = this.getFirstItem(item.items);
      if (subItem) {
        return subItem;
      }
    }
    return this.navItems[0];
  }

  async mounted(): Promise<void> {
    this.navItemSelected(this.getFirstItem(this.filteredNavItems));
  }
}
</script>

<style lang="scss">
.admin-page-wrapper {
  height: 100%;
  display: grid;
  grid-template-columns: 256px auto;
}
</style>
