<template>
  <v-container fluid v-show="isAdmin" style="height: 100%">
    <div class="admin-page-wrapper">
      <admin-navigation :items="navItems" @itemSelected="navItemSelected"></admin-navigation>
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
import { useOauthStore } from "@/store/oauth/store";
import {
  mdiAccountBoxOutline,
  mdiAccountGroup, mdiAccountNetwork,
  mdiAccountQuestion,
  mdiAccountRemove, mdiBriefcase,
  mdiChartLine, mdiChatRemove, mdiChatRemoveOutline,
  mdiCog, mdiFormatAlignLeft, mdiGift, mdiMapPlus, mdiMapSearch, mdiMessageAlert,
  mdiMonitorDashboard,
  mdiRocket, mdiRss, mdiSwordCross, mdiTable, mdiTooltipTextOutline,
} from "@mdi/js";

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
  },
})
export default class Admin extends Vue {
  private oauthStore = useOauthStore();
  navItems: Array<NavigationItem> = [
    {
      title: "Data Science",
      icon: mdiChartLine,
      items: [
        {
          key: "queue",
          title: "Live Queue Data",
          icon: mdiTable,
          component: "admin-queue-data",
        },
      ],
    },
    {
      title: "Moderation",
      icon: mdiAccountGroup,
      items: [
        {
          key: "banned_players",
          title: "Banned Players",
          icon: mdiAccountRemove,
          component: "admin-banned-players",
        },
        {
          key: "alts",
          title: "Smurf Checker",
          icon: mdiAccountQuestion,
          component: "admin-alts",
        },
        {
          key: "mute",
          title: "Global Mute",
          icon: mdiChatRemove,
          component: "admin-global-mute",
        },
        {
          key: "lounge_mute",
          title: "Lounge Mute",
          icon: mdiChatRemoveOutline,
          component: "admin-lounge-mute",
        },
        {
          key: "view_game_chat",
          title: "View Game Chat",
          icon: mdiFormatAlignLeft,
          component: "admin-view-game-chat",
        },
      ],
    },
    {
      title: "Player Settings",
      icon: mdiCog,
      items: [
        {
          key: "proxy_settings",
          title: "Proxy Settings",
          icon: mdiAccountNetwork,
          component: "admin-proxies",
        },
      ],
    },
    {
      title: "Launcher",
      icon: mdiRocket,
      items: [
        {
          key: "news",
          title: "News",
          icon: mdiRss,
          component: "admin-news-for-launcher",
        },
      ],
    },
    {
      title: "In-Game Settings",
      icon: mdiMonitorDashboard,
      items: [
        {
          key: "tips",
          icon: mdiTooltipTextOutline,
          title: "Loading screen tips",
          component: "admin-loading-screen-tips",
        },
        {
          key: "motd",
          icon: mdiMessageAlert,
          title: "Message of the Day",
          component: "admin-motd",
        },
      ],
    },
    {
      title: "Rewards",
      icon: mdiGift,
      items: [
        {
          key: "portraits",
          title: "Assign Portraits",
          icon: mdiAccountBoxOutline,
          component: "admin-assign-portraits",
        },
        {
          key: "manage-portraits",
          title: "Manage Portraits",
          icon: mdiBriefcase,
          component: "admin-manage-portraits",
        },
      ],
    },
    {
      title: "Maps",
      icon: mdiMapSearch,
      items: [
        {
          key: "maps",
          title: "Manage Maps",
          icon: mdiMapPlus,
          component: "admin-maps",
        },
      ],
    },
    {
      title: "Tournaments",
      icon: mdiSwordCross,
      items: [
        {
          key: "tournaments",
          title: "Manage Tournaments",
          icon: mdiSwordCross,
          component: "admin-tournaments",
        },
      ],
    },
  ];
  selectedNavItem = {};

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
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

  mounted(): void {
    this.navItemSelected(this.getFirstItem(this.navItems));
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
