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
import AdminPlayerManagement from "@/components/admin/AdminPlayerManagement.vue";

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
    AdminPlayerManagement
  }
})
export default class Admin extends Vue {
  navItems: Array<NavigationItem> = [
    {
      title: "Player Management",
      icon: "mdi-account-search",
      key: "search",
      component: "admin-player-management",
    },
    {
      title: "Ban List",
      key: "banned_players",
      icon: "mdi-account-remove",
      component: "admin-banned-players",
    },
    {
      title: "Launcher & News",
      icon: "mdi-rocket",
      key: "news",
      component: "admin-news-for-launcher"
    },
    {
      title: "Loading Screen Tips",
      icon: "mdi-monitor-dashboard",
      component: "admin-loading-screen-tips",
      key: "tips",
    },
    {
      title: "Live Queues",
      icon: "mdi-chart-line",
      key: "queue",
      component: "admin-queue-data",
    }
  ];
  selectedNavItem = {};

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  navItemSelected(item: NavigationItem) : void {
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

  mounted() : void {
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
