<template>
  <v-container>
    <v-row>
      <v-card-title class="mx-0" v-if="isAutomaticNode">
        Auto Node Overrides
      </v-card-title>
      <v-card-title class="mx-0" v-else>Node Overrides</v-card-title>
    </v-row>

    <v-row v-if="isLoaded">
      <v-chip-group
        v-model="chipGroupIndex"
        class="ma-2"
        active-class="info--text"
        column
        multiple
      >
        <v-chip
          v-for="(proxy, index) in availableProxies"
          :key="index"
          @click="updateProxies(proxy.id)"
          :input-value="showAsChecked(index)"
          label
          small
        >
          {{ $t(`proxies.${sanitizeString(proxy.id)}`) }}
        </v-chip>
      </v-chip-group>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch, Prop } from "vue-property-decorator";
import { Proxy, ProxySettings } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";

@Component({ components: {} })
export default class nodeOverridesCard extends Vue {
  private oauthStore = useOauthStore();
  @Prop({ default: false }) public automaticNodes?: boolean;
  @Prop() public passedOverrides!: string[];

  public chipGroupIndex = [] as number[];
  public isLoaded = false;
  public isProxyListChanged = false;
  public modifiedOverrides = [] as string[];

  // todo:
  // todo: 1. Figure out why the v-chip :input-value doesnt properly work on first page load. State looks fine eventually.
  // todo: 1.1. think this happens when you select the username too quickly before loading the reviewProxies component - need a break in it.
  // todo: 2. link "confirm" button on modal to PUT request
  // todo: 3. format PUT request to endpoint using setOverrides

  public isProxyListModified(): boolean {
    if (this.passedOverrides.length !== this.modifiedOverrides.length)
      return true;

    const uniqueValues = new Set([
      ...this.modifiedOverrides,
      ...this.passedOverrides,
    ]);

    for (const v of uniqueValues) {
      const modifiedOverridesCount = this.modifiedOverrides.filter(
        (e) => e === v
      ).length;
      const passedOverridesCount = this.passedOverrides.filter(
        (e) => e === v
      ).length;
      if (modifiedOverridesCount !== passedOverridesCount) return true;
    }

    return false;
  }

  public setProxyModified(val: boolean): void {
    this.$store.direct.dispatch.admin.proxyModified(val);
  }

  public updateProxies(node: string): void {
    if (this.modifiedOverrides.includes(node)) {
      const index = this.modifiedOverrides.indexOf(node);
      if (index > -1) {
        this.modifiedOverrides.splice(index, 1);
        this.updateProxyState(this.modifiedOverrides);
      }
    } else {
      this.modifiedOverrides.push(node);
      this.updateProxyState(this.modifiedOverrides);
    }
  }

  public updateProxyState(newOverrides: string[]): void {
    this.$store.direct.dispatch.admin.updateModifiedProxies({
      overrides: newOverrides,
      isAutomatic: this.isAutomaticNode,
    });
    this.$store.direct.dispatch.admin.proxyModified(this.isProxyListModified());
  }

  public showAsChecked(index: number): boolean {
    if (this.chipGroupIndex[index]) {
      return true;
    }
    return false;
  }

  public sanitizeString(string: string): string {
    let str = string;
    str = str.replace(/-/g, `_`);
    return str;
  }

  get searchedPlayersSetProxies(): ProxySettings {
    return this.$store.direct.state.admin.proxiesSetForSearchedPlayer;
  }

  get isAutomaticNode(): boolean {
    if (this.automaticNodes) {
      return true;
    }
    return false;
  }

  get availableProxies(): Proxy[] {
    return this.$store.direct.state.admin.availableProxies;
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  public async initiateChipGroupIndex(): Promise<void> {
    // sets the initial index array for the V-Chip-Group component to use
    for (let i = 0; i < this.availableProxies.length; i++) {
      for (let j = 0; j < this.passedOverrides.length; j++) {
        if (this.passedOverrides[j] === this.availableProxies[i].id) {
          this.chipGroupIndex.push(i);
        }
      }
    }
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(
        this.oauthStore.token
      );
      this.modifiedOverrides = JSON.parse(JSON.stringify(this.passedOverrides));
      await this.initiateChipGroupIndex();
      this.updateProxyState(this.passedOverrides);
      setTimeout(this.setLoaded, 100);
    }
  }

  public mounted(): void {
    this.init();
  }

  public setLoaded(): void {
    this.isLoaded = true;
  }
}
</script>

<style lang="scss"></style>
