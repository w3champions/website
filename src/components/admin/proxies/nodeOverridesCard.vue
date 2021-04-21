<template>
    <v-container v-if="setOverrides != undefined">
      
      <v-row>
        <v-card-title class="mx-0" v-if="isAutomaticNode">
          Auto Node Overrides
        </v-card-title>
        <v-card-title class="mx-0" v-else>
          Node Overrides
        </v-card-title>
      </v-row>

      <v-row>
        <v-chip-group
              class="ma-2"
              active-class="info--text"
              column
              multiple>
          <v-chip
            v-for="proxy in availableProxies"
            :key="proxy.id"
            :input-value="isNodeSelected(proxy.id, isAutomaticNode)"
            @click="updateProxies(proxy.id)"
            label
            small>
            {{ $t(`proxies.${sanitizeString(proxy.id)}`) }}
          </v-chip>
        </v-chip-group>
      </v-row>

    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch, Prop } from "vue-property-decorator";
import { Proxy, ProxySettings } from "@/store/admin/types"

@Component({ components: {} })
export default class nodeOverridesCard extends Vue {
  @Prop({default: false}) public automaticNodes?: boolean;
  @Prop() public passedOverrides!: string[];

  public setOverrides = [] as string[];
  //public initOverrides = [] as string[];

  public updateProxies(node : string) : void {
    if (this.proxyIsSet(node)) {
      this.removeFromSetProxy(node);
    } else {
      this.addToSetProxy(node);
    }
  }

  public addToSetProxy(node : string) : void {
    if (!this.proxyIsSet(node)) {
      // add to proxy
      this.setOverrides.push(node);
    }
    console.log(this.setOverrides);
  }

  public removeFromSetProxy(node : string) : void {
    
    const index = this.setOverrides.indexOf(node);
    
    if (index > -1 && this.proxyIsSet(node)) {
      this.setOverrides.splice(index, 1);
      console.log(this.setOverrides)
    }
    
  }

  public proxyIsSet(node : string ) : boolean {
    return this.setOverrides.includes(node);
  } 

  public isNodeSelected(node : string, isAutomatic : boolean) : boolean {
    // matches the proxies saved in the state for the searched player against the proxy parameter

    if (isAutomatic && this.proxyIsSet(node)) {
      return true;
    }

    if (this.proxyIsSet(node)) {
      return true;
    }

    return false;
  }

  public sanitizeString(string : string) : string {
    let str = string;
    str = str.replace(/-/g, `_`)
    return str;
  }

  get searchedPlayersSetProxies() : ProxySettings {
    return this.$store.direct.state.admin.proxiesSetForSearchedPlayer
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
      this.setOverrides = this.passedOverrides;
      //this.initOverrides = this.passedOverrides;
    }
  }

  public mounted() : void {
    this.init();
  }
}
</script>

<style lang="scss">

</style>