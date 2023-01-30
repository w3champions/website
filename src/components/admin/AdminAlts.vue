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

    <v-card v-if="showAlts">
      <v-card-title>Smurfs:</v-card-title>
      <v-list>
        <template v-for="alt in alts">
          <v-list-item :key="alt">
            {{ alt }}
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { PlayerProfile } from "@/store/player/types";

@Component({})
export default class AdminAlts extends Vue {
  public searchPlayerModel = {} as PlayerProfile;
  public search = "";
  public showAlts = false;
  public oldSearchTerm = "";
  public alts = [] as string[];

  public revertToDefault(): void {
    this.showAlts = false;
    this.oldSearchTerm = "";
    this.$store.direct.dispatch.admin.clearSearch();
    this.alts = [];
  }

  @Watch("searchPlayerModel")
  public async onSearchStringChanged(
    searchedPlayer: PlayerProfile
  ): Promise<void> {
    if (!searchedPlayer) return;

    if (searchedPlayer) {
      const btag = searchedPlayer.battleTag;

      this.alts = await this.$store.direct.dispatch.admin.getAltsForPlayer(btag);

      if ((this.alts != null || undefined) && this.alts.length > 0) {
        this.showAlts = true;
      } else {
        this.revertToDefault();
      }
    }
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
}
</script>

<style lang="scss"></style>
