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

  public setOverrides = [] as string[];
  public chipGroupIndex = [] as number[];
  public isLoaded = false;

  // todo:
  // 1. add button that appears when nodes have been set different to what they were initated at
  // 2. add warning about modifying auto-node overrides
  // 3. create modal for "are you sure" dialog
  // 4. link "confirm" button on modal to PUT request
  // 5. format PUT request to endpoint using setOverrides

  public updateProxies(node : string) : void {
    if (this.setOverrides.includes(node)) {
      const index = this.setOverrides.indexOf(node);
      if (index > -1) {
        this.setOverrides.splice(index, 1);
      }
    } else {
      this.setOverrides.push(node);
    }
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
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(this.$store.direct.state.oauth.token);
      this.setOverrides = this.passedOverrides;
      this.initiateChipGroupIndex();
      this.isLoaded = true;
    }
  }

  public mounted() : void {
    this.init();
  }
}
</script>

<style lang="scss">

</style>