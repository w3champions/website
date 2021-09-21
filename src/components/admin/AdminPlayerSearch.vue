<template>
    <v-container>
        <!-- Autocomplete Btag search -->
        <v-autocomplete
          class="ml-5 mr-5"
          v-model="searchPlayerProxiesModel"
          append-icon="mdi-magnify"
          label="Search BattleNet Tag"
          clearable
          placeholder=" "
          :items="searchedPlayers"
          :search-input.sync="search"
          item-text="player.playerIds[0].battleTag"
          item-value="player.playerIds[0].id"
          return-object
          @click:clear="revertToDefault">
        </v-autocomplete>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import nodeOverridesCard from "@/components/admin/proxies/nodeOverridesCard.vue";
import reviewProxies from "@/components/admin/proxies/reviewProxies.vue";
import { SearchedPlayer } from "@/store/admin/types";

@Component({ components: { nodeOverridesCard, reviewProxies } })
export default class AdminProxies extends Vue {

  public searchPlayerProxiesModel = {} as SearchedPlayer;
  public search = "";
  public oldSearchTerm = "";

  public revertToDefault() : void {
    this.oldSearchTerm = "";
    this.$store.direct.dispatch.admin.clearSearch()
  }
  
  @Watch("searchPlayerProxiesModel")
  public async onSearchStringChanged(searchedPlayer : SearchedPlayer) : Promise<void> {
    if (!searchedPlayer) return
    
    if (searchedPlayer) {
      let bTag = searchedPlayer.player.playerIds[0].battleTag;

      // set searched player in state
    }
  }

  @Watch("search")
  public onSearchChanged(newValue: string) : void{
    if (newValue && newValue.length > 2 && newValue >= this.oldSearchTerm) {
      this.$store.direct.dispatch.admin.searchBnetTag({
        searchText: newValue.toLowerCase()
      });
      this.oldSearchTerm = newValue;
    } else {
      this.revertToDefault()
    }
  }  

  get searchedPlayers(): SearchedPlayer[] {
    return this.$store.direct.state.admin.searchedPlayers;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged() : void {
    this.init();
  }

  private async init() : Promise<void> {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(this.$store.direct.state.oauth.token);
    }
  }

  async mounted() : Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss">

</style>