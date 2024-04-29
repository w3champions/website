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
          :key="index"
          v-if="!item.items || item.items.length === 0"
          :to="{ name: item.title }"
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon || mdiAccountTie }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-group
          :key="index"
          v-if="item.items && item.items.length > 0"
          :value="false"
          v-bind:prepend-icon="item.icon"
          no-action
        >
          <template v-slot:activator>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </template>

          <v-list-item
            class="ml-0 pl-6"
            v-for="(subItem, i) in item.items"
            :key="i"
            :to="{ name: subItem.title }"
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
import { NavigationItem } from "@/store/admin/types";
import { mdiAccountTie } from "@mdi/js";
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";

import {
  mdiAccountBoxOutline, mdiAccountGroup, mdiAccountNetwork, mdiAccountQuestion,
  mdiAccountRemove, mdiBriefcase, mdiChartLine, mdiChatRemove, mdiChatRemoveOutline,
  mdiCog, mdiFormatAlignLeft, mdiGift, mdiMapPlus, mdiMapSearch, mdiMessageAlert,
  mdiMonitorDashboard, mdiRocket, mdiRss, mdiSwordCross, mdiTable, mdiTooltipTextOutline,
  mdiAccountKey, mdiFileDocumentOutline, mdiFileDocument
} from "@mdi/js";
import { EPermission } from "@/store/admin/permission/types";
import { useOauthStore } from "@/store/oauth/store";

@Component({ components: {} })
export default class AdminNavigation extends Vue {
  private oauthStore = useOauthStore();
  public mdiAccountTie = mdiAccountTie;

  get permissions(): string[] {
    return this.oauthStore.permissions;
  }

  get filteredNavItems(): NavigationItem[] {
    return this.navItems.filter((item) => this.permissions.includes(EPermission[item.permission]));
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
    return items[0];
  }

  mounted() {
    this.init();
  }

  init() {
    if (this.permissions.length === 0) return;
    const lastPathFragment = this.$route.path.split("/").pop();

    // Route to the first available page if the user navigated to the admin panel.
    if (lastPathFragment === "admin") {
      const firstItem = this.getFirstItem(this.filteredNavItems);
      
      this.$router.push(`admin/${firstItem.component}`);
    }
  }

  @Watch("permissions")
  public permissionsWatcher(): void {
    this.init();
  }

  navItems: Array<NavigationItem> = [
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
        },
        {
          title: "Smurf Checker",
          icon: mdiAccountQuestion,
          permission: EPermission.Moderation,
          component: "admin-alts",
        },
        {
          title: "Global Mute",
          icon: mdiChatRemove,
          permission: EPermission.Moderation,
          component: "admin-global-mute",
        },
        {
          title: "Lounge Mute",
          icon: mdiChatRemoveOutline,
          permission: EPermission.Moderation,
          component: "admin-lounge-mute",
        },
        {
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
          title: "Loading Screen Tips",
          icon: mdiTooltipTextOutline,
          permission: EPermission.Content,
          component: "admin-loading-screen-tips",
        },
        {
          title: "Message Of The Day",
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
          title: "Assign Portraits",
          icon: mdiAccountBoxOutline,
          permission: EPermission.Content,
          component: "admin-assign-portraits",
        },
        {
          title: "Manage Portraits",
          icon: mdiBriefcase,
          permission: EPermission.Content,
          component: "admin-manage-portraits",
        },
        {
          title: "Manage Alibaba Files",
          icon: mdiFileDocumentOutline,
          permission: EPermission.Content,
          component: "admin-storage-alibaba",
        },
        {
          title: "Manage S3 Files",
          icon: mdiFileDocument,
          permission: EPermission.Content,
          component: "admin-storage-s3",
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
        },
      ],
    },
  ];
}
</script>

<style lang="scss"></style>
