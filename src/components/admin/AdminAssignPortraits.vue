<template>
  <v-container>
    <!-- Autocomplete Btag search -->
    <v-autocomplete
      class="ml-5 mr-5"
      v-model="searchPlayerPortraitsModel"
      append-icon="mdi-magnify"
      label="Search BattleNet Tag"
      clearable
      placeholder=" "
      :items="searchedPlayers"
      :search-input.sync="search"
      item-text="player.playerIds[0].battleTag"
      item-value="player.playerIds[0].id"
      return-object
      @click:clear="revertToDefault"
    ></v-autocomplete>

    <v-card v-if="showPlayersPortraits"> <!-- showPlayersPortraits -->
      <v-container>
        <v-row class="justify-center align-center mb-1">
          <v-card-title>Portraits for {{ bnetTag }}:</v-card-title>
        </v-row>
        <v-divider />
        <v-row class="mt-0">
          <v-col>
            <v-card-title class="justify-center">Assigned</v-card-title>
            <v-col
              v-for="portraitId in searchedPlayerPortraits"
              :key="portraitId"
              class="d-flex child-flex"
              cols=3>
              <assign-portrait :portraitId="portraitId"></assign-portrait>
            </v-col>
          </v-col>
          <v-divider vertical />
          <v-col>
            <v-card-title class="justify-center">Available</v-card-title>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { SearchedPlayer } from "@/store/admin/types";
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import AssignPortrait from "./portraits/AssignPortrait.vue";

@Component({ components: { AssignPortrait } })
export default class AdminAssignPortraits extends Vue {
  public searchPlayerPortraitsModel = {} as SearchedPlayer;
  public playerPortraits = [] as number[];
  public search = "";
  public oldSearchTerm = "";
  public showPlayersPortraits = false;

  get bnetTag() {
    return "Cepheid#1467";
    //return this.searchPlayerPortraitsModel.player.playerIds[0].battleTag;
  }

  get searchedPlayerPortraits(): number[] {
    //return this.$store.direct.state.admin.searchedPlayerSpecialPortraits;
    return [5, 6];
  }

  @Watch("searchPlayerPortraitsModel")
  public async onSearchStringChanged(
    searchedPlayer: SearchedPlayer
  ): Promise<void> {
    if (!searchedPlayer) return;

    if (searchedPlayer) {
      let btag = searchedPlayer.player.playerIds[0].battleTag;

      this.playerPortraits =
        await this.$store.direct.dispatch.admin.loadSpecialPortraitsForPlayer(
          btag
        );

      if (
        (this.playerPortraits != null || undefined) &&
        this.playerPortraits.length > 0
      ) {
        this.showPlayersPortraits = true;
      } else {
        this.revertToDefault();
      }
    }
  }

  @Watch("search") public onSearchChanged(newValue: string): void {
    if (newValue && newValue.length > 2 && newValue >= this.oldSearchTerm) {
      this.$store.direct.dispatch.admin.searchBnetTag({
        searchText: newValue.toLowerCase(),
      });
      this.oldSearchTerm = newValue;
    } else {
      this.revertToDefault();
    }
  }

  get searchedPlayers(): SearchedPlayer[] {
    return this.$store.direct.state.admin.searchedPlayers;
  }

  public revertToDefault(): void {
    this.showPlayersPortraits = false;
    this.oldSearchTerm = "";
    this.$store.direct.dispatch.admin.clearSearch();
    this.playerPortraits = [];
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init(): Promise<void> {
    this.$store.direct.dispatch.admin.loadAllSpecialPortraits;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
