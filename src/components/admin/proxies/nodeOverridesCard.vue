<template>
    <v-container>
      <v-card-title class="mx-0" v-if="isAutomaticNode">
        Automatic Node Overrides
      </v-card-title>
      <v-card-title class="mx-0" v-else>
        Node Overrides
      </v-card-title>
      <div 
        v-for="proxy in availableProxies"
        :key="proxy.id">
        <!-- {{ this.$t(`proxies.${sanitizeString(proxy.id)}`) }} -->
        {{ $t(`proxies.${sanitizeString(proxy.id)}`) }}
      </div>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch, Prop } from "vue-property-decorator";
import { Proxy } from "@/store/admin/types"

@Component({ components: {} })
export default class nodeOverridesCard extends Vue {
  @Prop() public automaticNodes?: boolean;

  get isAutomaticNode() : boolean {
    if (this.automaticNodes) {
      return this.automaticNodes;
    }
    return false;
  }

  public sanitizeString(string : string) : string {

    let str = string;
    str = str.replace(/-/g, `_`)

    return str;
  }

  get availableProxies() : Proxy[] {
    return this.$store.direct.state.admin.availableProxies;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged() : void {
    this.init();
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(this.$store.direct.state.oauth.token);
    }
  }
}
</script>

<style lang="scss">

</style>