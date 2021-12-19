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
      <v-tab class="profileTab" exact :to="{name: 'AdminPlayerManagementProfile'}">
        {{ $t("views_admin.profile") }}
      </v-tab>
      <v-tab class="profileTab" :to="{name: 'AdminPlayerManagementPortraits'}">
        {{ $t("views_admin.portraits") }}
      </v-tab>
      <v-tab class="profileTab" :to="{name: 'AdminPlayerManagementSanctions'}">
        {{ $t("views_admin.sanctions") }}
      </v-tab>
      <v-tab class="profileTab" :to="{name: 'AdminPlayerManagementFloSettings'}">
        {{ $t("views_admin.flosettings") }}
      </v-tab>
      <v-tab class="profileTab" :to="{name: 'AdminPlayerManagementStats'}">
        {{ $t("views_admin.stats") }}
      </v-tab>
    </v-tabs>
    <!-- <admin-player-management-portraits></admin-player-management-portraits> -->
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import AdminPlayerManagementPortraits from "./AdminPlayerManagementPortraits.vue"

@Component({ components: { AdminPlayerManagementPortraits } })
export default class AdminPlayerManagementProfile extends Vue {
  @Prop() tag!: string;

  currentTab = 'Profile';
  profileTabs = [
    'Profile',
    'Portrait',
    'Sanctions',
    'Flo Settings',
    'Stats'
  ]

  private async init() : Promise<void> {
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting(this.tag);
  }

  async mounted() : Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
