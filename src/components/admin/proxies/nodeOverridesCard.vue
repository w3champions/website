<template>
    <v-container>
      <v-card-title class="mx-0" v-if="setter">
        Set Node Overrides
      </v-card-title>
      <v-card-title class="mx-0" v-else-if="isAutomaticNode">
        Auto Node Overrides
      </v-card-title>
      <v-card-title class="mx-0" v-else>
        Node Overrides
      </v-card-title>
      <div 
        v-for="proxy in availableProxies"
        :key="proxy.id">
        <div>
          {{ $t(`proxies.${sanitizeString(proxy.id)}`) }}
        </div>
      </div>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch, Prop } from "vue-property-decorator";
import { Proxy, ProxySettings } from "@/store/admin/types"

@Component({ components: {} })
export default class nodeOverridesCard extends Vue {
  @Prop() public automaticNodes?: boolean;
  @Prop() public setNewProxies?: ProxySettings;
  @Prop({ default: false }) public setter? : boolean;

  // how the logic should work:

  // Grab array with all the proxies the player currently has - this is held in state value:
  // this.$store.direct.state.admin.proxiesSetForSearchedPlayer()
  
  // if that value matches a value in availableProxies - also held in state value:
  // this.$store.direct.state.admin.availableProxies

  // set this as a SELECTED proxy
  // take note to separate automaticNodeOverrides and nodeOverride
  
  // show selected proxies as SELECTED v-chip components
  // on event update SELECT or DESELECT chip components - update setNewProxies variable (this is v-model to this comp)

  // on click CONFIRM button
  // have adminService do a PUT request for the new selections.

  // bonus: have a modal pop up with the newly set proxies to let the user know

  public sanitizeString(string : string) : string {
    let str = string;
    str = str.replace(/-/g, `_`)
    return str;
  }
  
  get isAutomaticNode() : boolean {
    if (this.automaticNodes) {
      return this.automaticNodes;
    }
    return false;
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

  public mounted() {
    console.log(`isSetter: ${this.setter}`)
    console.log(`isAutomaticNode: ${this.isAutomaticNode}`)
  }
}
</script>

<style lang="scss">

</style>