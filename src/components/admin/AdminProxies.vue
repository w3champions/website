<template>
  <v-container>
    <v-row>
      <!-- Autocomplete Btag search -->
      <v-autocomplete
        class="ml-5 mr-5"
        v-model="searchPlayerModel"
        append-icon="mdi-magnify"
        label="Search BattleNet Tag"
        clearable
        placeholder=" "
        :items="searchedPlayers"
        :search-input.sync="search"
        item-text="battleTag"
        item-value="battleTag"
        return-object
        @click:clear="revertToDefault"
        autofocus
      ></v-autocomplete>
    </v-row>

    <review-proxies
      v-if="showProxyOptions"
      :proxies="availableProxies"
    ></review-proxies>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import nodeOverridesCard from "@/components/admin/proxies/nodeOverridesCard.vue";
import reviewProxies from "@/components/admin/proxies/reviewProxies.vue";
import { Proxy, ProxySettings } from "@/store/admin/types";
import { PlayerProfile } from "@/store/player/types";
import { useOauthStore } from "@/store/oauth/store";

@Component({ components: { nodeOverridesCard, reviewProxies } })
export default class AdminProxies extends Vue {
  private oauthStore = useOauthStore();
  public searchPlayerModel = {} as PlayerProfile;
  public search = "";
  public showProxyOptions = false;
  public oldSearchTerm = "";

  public revertToDefault(): void {
    this.showProxyOptions = false;
    this.oldSearchTerm = "";
    this.$store.direct.dispatch.admin.clearSearch();
  }

  @Watch("searchPlayerModel")
  public async onSearchStringChanged(
    searchedPlayer: PlayerProfile
  ): Promise<void> {
    if (!searchedPlayer) return;

    if (searchedPlayer) {
      const bTag = searchedPlayer.battleTag;

      const proxies = await this.$store.direct.dispatch.admin.getProxiesForPlayer(bTag);
      await this.setPlayerProxies(proxies);

      if (proxies._id != null || undefined) {
        this.showProxyOptions = true;
      } else {
        this.revertToDefault();
      }
    }
  }

  public async setPlayerProxies(proxies: ProxySettings): Promise<void> {
    this.$store.direct.dispatch.admin.updateModifiedProxies({
      overrides: proxies.nodeOverrides,
      isAutomatic: false,
    });
    this.$store.direct.dispatch.admin.updateModifiedProxies({
      overrides: proxies.automaticNodeOverrides,
      isAutomatic: true,
    });
  }

  get proxiesOnSearchedTag(): ProxySettings {
    return this.$store.direct.state.admin.proxiesSetForSearchedPlayer;
  }

  @Watch("search")
  public onSearchChanged(newValue: string): void {
    if (newValue && newValue.length > 2 && newValue !== this.oldSearchTerm) {
      this.$store.direct.dispatch.admin.searchBnetTag({
        searchText: newValue.toLowerCase(),
      });
      this.oldSearchTerm = newValue;
    } else {
      this.revertToDefault();
    }
  }

  get searchedPlayers(): PlayerProfile[] {
    return this.$store.direct.state.admin.searchedPlayers;
  }

  public sanitizeString(string: string): string {
    let str = string;
    str = str.replace(/-/g, `_`);

    return str;
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

  private async init(): Promise<void> {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(
        this.oauthStore.token
      );
    }
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
