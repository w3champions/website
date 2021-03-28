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

@Component({
  components: {
    AdminNavigation,
    AdminBannedPlayers,
    AdminLoadingScreenTips,
    AdminNewsForLauncher,
    AdminQueueData
  }
})
export default class Admin extends Vue {
  navItems: Array<NavigationItem> = [
    {
      title: "Player Management",
      icon: "mdi-account-group",
      items: [
        {
          key: "banned_players",
          title: "Banned Players",
          icon: "mdi-account-remove",
          component: "admin-banned-players"
        },
        {
          key: "proxy_settings",
          title: "Proxy Settings",
          icon: "mdi-account-network",
          component: "admin-proxy-settings"
        }
      ]
    },
    {
      title: "Launcher",
      icon: "mdi-rocket",
      items: [
        {
          key: "news",
          title: "News for Launcher",
          icon: "mdi-rss",
          component: "admin-news-for-launcher"
        }
      ]
    },{
      title: "In-Game Settings",
      icon: "mdi-monitor-dashboard",
      items: [
        {
          key: "tips",
          icon: "mdi-tooltip-text-outline",
          title: "Loading screen tips",
          component: "admin-loading-screen-tips"
        }
      ]
    }
    ,
    {
      title: "Data Science",
      icon: "mdi-chart-line",
      items: [
      {
        key: "queue",
        title: "Live Queue Data",
        icon: "mdi-table",
        component: "admin-queue-data",
      }
      ]
    }
  ];
  selectedNavItem = {};

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  navItemSelected(item: any) {
    this.selectedNavItem = item;
  }

  getFirstItem(items: Array<NavigationItem>): NavigationItem | undefined {
    for (let item of items) {
      if (!item.items) {
        return item;
      }
      const subItem = this.getFirstItem(item.items);
      if (subItem) {
        return subItem;
      }
    }
  }

  mounted() {
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
