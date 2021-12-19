<template>
  <v-container fluid>
      <!-- Autocomplete Btag search -->
      <v-autocomplete
        class="ml-5 mr-5"
        v-model="searchPlayerMgmtModel"
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
      <admin-player-management-panel
        v-if="showPlayer"
        :tag="getManagedPlayer()">
      </admin-player-management-panel>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { SearchedPlayer } from "@/store/admin/types";
import AdminPlayerManagementPanel from "./playermanagement/AdminPlayerManagementPanel.vue"

@Component({ components: { AdminPlayerManagementPanel }})
export default class AdminPlayerManagement extends Vue {

  public searchPlayerMgmtModel = {} as SearchedPlayer;
  public search = "";
  public oldSearchTerm = "";
  public showPlayer = false;

  public revertToDefault() : void {
    this.oldSearchTerm = "";
    this.$store.direct.dispatch.admin.clearSearch();
    this.showPlayer = false;
  }
  
  public getManagedPlayer() : string {
    return this.$store.direct.state.admin.managedPlayer;
  }
  
  @Watch("searchPlayerMgmtModel")
  public async onSearchStringChanged(searchedPlayer : SearchedPlayer) : Promise<void> {
    if (!searchedPlayer) return
    
    if (searchedPlayer) {
      let bTag = searchedPlayer.player.playerIds[0].battleTag;
      this.showPlayer = true;
      this.$store.direct.dispatch.admin.setManagedPlayer(bTag);
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
  
  get searchedTag(): string {
    return this.$store.direct.state.admin.searchedBattletag;
  }

  get searchedPlayers(): SearchedPlayer[] {
    return this.$store.direct.state.admin.searchedPlayers;
  }  
}
</script>

<style lang="scss">



</style>