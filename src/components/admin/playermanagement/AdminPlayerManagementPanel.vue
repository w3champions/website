<template>
  <v-card>
    <v-toolbar
      flat>
      <v-card-title>
        {{ tag }}
      </v-card-title>
    </v-toolbar>
    <v-tabs>
      <v-tabs-slider/>
      <v-tab class="adminTab" exact :to="{name: 'AdminPlayerManagementProfileTab'}">
        {{ $t("views_admin.profile") }}
      </v-tab>
      <v-tab class="adminTab" :to="{name: 'AdminPlayerManagementPortraitsTab'}">
        {{ $t("views_admin.portraits") }}
      </v-tab>
      <v-tab class="adminTab" :to="{name: 'AdminPlayerManagementSanctionsTab'}">
        {{ $t("views_admin.sanctions") }}
      </v-tab>
      <v-tab class="adminTab" :to="{name: 'AdminPlayerManagementFlosettingsTab'}">
        {{ $t("views_admin.flosettings") }}
      </v-tab>
      <v-tab class="adminTab" :to="{name: 'AdminPlayerManagementStatsTab'}">
        {{ $t("views_admin.stats") }}
      </v-tab>
      <v-tab class="adminTab" :to="{ name: 'AdminPlayerManagementSmurfsTab' }">
        {{ $t("views_admin.smurfs") }}
      </v-tab>

    </v-tabs>
    <v-card-text>
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import AdminPlayerManagementProfileTab from "./tabs/AdminPlayerManagementProfileTab.vue"
import AdminPlayerManagementPortraitsTab from "./tabs/AdminPlayerManagementPortraitsTab.vue"
import AdminPlayerManagementSanctionsTab from "./tabs/AdminPlayerManagementSanctionsTab.vue"
import AdminPlayerManagementFlosettingsTab from "./tabs/AdminPlayerManagementFlosettingsTab.vue"
import AdminPlayerManagementStatsTab from "./tabs/AdminPlayerManagementStatsTab.vue"

@Component({ components: { 
  AdminPlayerManagementProfileTab,
  AdminPlayerManagementPortraitsTab,
  AdminPlayerManagementSanctionsTab,
  AdminPlayerManagementFlosettingsTab,
  AdminPlayerManagementStatsTab }})
export default class AdminPlayerManagementPanel extends Vue {
  @Prop() tag!: string;

  private async init() : Promise<void> {
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting(this.tag);
  }

  async mounted() : Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
