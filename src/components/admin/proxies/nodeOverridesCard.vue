<template>
    <v-container v-if="isLoaded">
      
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
              v-model="chipGroupIndex"
              class="ma-2"
              active-class="info--text"
              column
              multiple>
          <v-chip
            v-for="(proxy, index) in availableProxies"
            :key="proxy.id"
            @click="updateProxies(proxy.id)"
            :input-value="showAsChecked(index)"
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

  public chipGroupIndex = [] as number[];
  public isLoaded = false;
  public isProxyListChanged = false;
  public modifiedOverrides = [] as string[];

  // todo:
  // todo: 1. add button that appears when nodes have been set different to what they were initated at
  // todo: 2. add warning about modifying auto-node overrides
  // todo: 3. create modal for "are you sure" dialog
  // todo: 4. link "confirm" button on modal to PUT request
  // todo: 5. format PUT request to endpoint using setOverrides


  public isProxyListModified() : boolean {

    if (this.passedOverrides.length !== this.modifiedOverrides.length) return true;
    
    const uniqueValues = new Set([...this.modifiedOverrides, ...this.passedOverrides]);
    
    for (const v of uniqueValues) {
      const modifiedOverridesCount = this.modifiedOverrides.filter(e => e === v).length;
      const passedOverridesCount = this.passedOverrides.filter(e => e === v).length;
      if (modifiedOverridesCount !== passedOverridesCount) return true;
    }

    return false;
  }

  public setProxyModified(val : boolean) : void {
    this.$store.direct.dispatch.admin.proxyModified(val);
  }

  public updateProxies(node : string) : void {
    if (this.modifiedOverrides.includes(node)) {
      const index = this.modifiedOverrides.indexOf(node);
      if (index > -1) {
        this.modifiedOverrides.splice(index, 1);
        this.updateProxyState(this.modifiedOverrides);
      }
    } else {
      this.modifiedOverrides.push(node);
      this.updateProxyState(this.modifiedOverrides)
    }
  }

  public updateProxyState(newOverrides : string[]) : void {
    this.$store.direct.dispatch.admin.updateModifiedProxies({overrides: newOverrides, isAutomatic: this.isAutomaticNode});
    this.$store.direct.dispatch.admin.proxyModified(this.isProxyListModified());
  }

  public showAsChecked(index : number) : boolean {
    if (this.chipGroupIndex.includes(index)) {
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

  public initiateChipGroupIndex() : void {

    // sets the intial index array for the V-Chip-Group component to use
    for (let i=0; i<this.availableProxies.length; i++) {
      for (let j=0; j<this.passedOverrides.length; j++) {
        if (this.passedOverrides[j] === this.availableProxies[i].id) {
          this.chipGroupIndex.push(i);
        }
      }
    }
    
    this.isLoaded = true;
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(this.$store.direct.state.oauth.token);
      this.modifiedOverrides = JSON.parse(JSON.stringify(this.passedOverrides));
      this.initiateChipGroupIndex();
    }
  }

  public mounted() : void {
    this.init();
  }
}
</script>

<style lang="scss">

</style>