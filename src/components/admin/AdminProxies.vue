<template>
  <div>
    <v-card-title>
      Proxy Settings
    </v-card-title>
    <v-container>
      <v-row>
        <player-search
          @searchCleared="searchCleared"
          @playerFound="playerFound"
          classes="ml-5 mr-5"
        ></player-search>
      </v-row>

      <review-proxies
        v-if="showProxyOptions"
        :proxies="availableProxies"
      ></review-proxies>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import nodeOverridesCard from "@/components/admin/proxies/nodeOverridesCard.vue";
import reviewProxies from "@/components/admin/proxies/reviewProxies.vue";
import { Proxy, ProxySettings } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";

@Component({ components: { nodeOverridesCard, reviewProxies, PlayerSearch } })
export default class AdminProxies extends Vue {
  private oauthStore = useOauthStore();
  public showProxyOptions = false;
  private adminStore = useAdminStore();

  async playerFound(bTag: string): Promise<void> {
    const proxies = await this.adminStore.getProxiesForPlayer(bTag);
      await this.setPlayerProxies(proxies);

      if (proxies._id) {
        this.showProxyOptions = true;
      }
  }

  searchCleared() {
    this.showProxyOptions = false;
  }

  public async setPlayerProxies(proxies: ProxySettings): Promise<void> {
    this.adminStore.updateModifiedProxies({
      overrides: proxies.nodeOverrides,
      isAutomatic: false,
    });
    this.adminStore.updateModifiedProxies({
      overrides: proxies.automaticNodeOverrides,
      isAutomatic: true,
    });
  }

  get proxiesOnSearchedTag(): ProxySettings {
    return this.adminStore.proxiesSetForSearchedPlayer;
  }

  get availableProxies(): Proxy[] {
    return this.adminStore.availableProxies;
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.isAdmin) {
      await this.adminStore.loadAvailableProxies(this.oauthStore.token);
    }
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
