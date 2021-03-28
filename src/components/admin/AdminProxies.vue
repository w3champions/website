<template>
  <v-container>
      <v-card>
          <v-card-title>
              Proxy Settings
          </v-card-title>
      </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
//import { BannedPlayer, LoadingScreenTip, NewsMessage } from "@/store/admin/types";

@Component({ components: {} })
export default class AdminProxies extends Vue {

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged() {
    this.init();
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(this.$store.direct.state.oauth.token);
    }
  }

  async mounted() {
    await this.init();
  }
}
</script>

<style lang="scss">

</style>