<template>
  <v-container fluid v-show="isAdmin" style="height: 100%">
    <div class="admin-page-wrapper">
      <admin-navigation :items="navItems" v-on:itemSelected="navItemSelected"></admin-navigation>
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
import AdminAssignPortraits from "@/components/admin/AdminAssignPortraits.vue";
import AdminManagePortraits from "@/components/admin/AdminManagePortraits.vue";
import AdminMaps from "@/components/admin/AdminMaps.vue";
import AdminMotd from "@/components/admin/AdminMotd.vue";
import AdminViewGameChat from "@/components/admin/AdminViewGameChat.vue";

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
    AdminAssignPortraits,
    AdminManagePortraits,
    AdminMaps,
    AdminMotd,
    AdminViewGameChat,
  },
})
export default class Admin extends Vue {
  navItems: Array<NavigationItem> = [
    {
      title: "Moderation",
      icon: "mdi-account-group",
      items: [
        {
          key: "banned_players",
          title: "Banned Players",
          icon: "mdi-account-remove",
          component: "admin-banned-players",
        },
        {
          key: "alts",
          title: "Smurf Checker",
          icon: "mdi-account-question",
          component: "admin-alts",
        },
        {
          key: "mute",
          title: "Global Mute",
          icon: "mdi-chat-remove",
          component: "admin-global-mute",
        },
        {
          key: "view_game_chat",
          title: "View Game Chat",
          icon: "mdi-format-align-left",
          component: "admin-view-game-chat",
        }
      ],
    },
    {
      title: "Player Settings",
      icon: "mdi-cog",
      items: [
        {
          key: "proxy_settings",
          title: "Proxy Settings",
          icon: "mdi-account-network",
          component: "admin-proxies",
        },
      ],
    },
    {
      title: "Launcher",
      icon: "mdi-rocket",
      items: [
        {
          key: "news",
          title: "News",
          icon: "mdi-rss",
          component: "admin-news-for-launcher",
        },
      ],
    },
    {
      title: "In-Game Settings",
      icon: "mdi-monitor-dashboard",
      items: [
        {
          key: "tips",
          icon: "mdi-tooltip-text-outline",
          title: "Loading screen tips",
          component: "admin-loading-screen-tips",
        },
        {
          key: "motd",
          icon: "mdi-message-alert",
          title: "Message of the Day",
          component: "admin-motd",
        }
      ],
    },
    {
      title: "Data Science",
      icon: "mdi-chart-line",
      items: [
        {
          key: "queue",
          title: "Live Queue Data",
          icon: "mdi-table",
          component: "admin-queue-data",
        },
      ],
    },
    {
      title: "Rewards",
      icon: "mdi-gift",
      items: [
        {
          key: "portraits",
          title: "Assign Portraits",
          icon: "mdi-account-box-outline",
          component: "admin-assign-portraits",
        },
        {
          key: "manage-portraits",
          title: "Manage Portraits",
          icon: "mdi-briefcase",
          component: "admin-manage-portraits",
        }
      ],
    },
    {
      title: "Maps",
      icon: "mdi-map-search",
      items: [
        {
          key: "maps",
          title: "Manage Maps",
          icon: "mdi-map-plus",
          component: "admin-maps",
        },
      ],
    },
  ];
  selectedNavItem = {};

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  navItemSelected(item: NavigationItem): void {
    this.selectedNavItem = item;
  }

  getFirstItem(items: Array<NavigationItem>): NavigationItem {
    for (let item of items) {
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
